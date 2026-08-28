import Phaser from 'phaser';
import { GAME_AUDIO, audioForNewClue, totalContradictions, type GameAudioName } from '../audio/gameAudio';
import { clueById, witnessById } from '../data/caseData';
import { useInvestigationStore } from '../state/investigationStore';
import { useWorldStore } from '../state/worldStore';
import { readEntityAnchors, requireEntityAnchor } from './mapEntities';
import { readMapTransitions, type MapTransition } from './mapTransitions';
import { readMapZones } from './mapZones';
import {
  CLUE_TEXTURE_BY_ID,
  ROOSEVELT_FLOOR_TEXTURE_BY_MAP,
  ROOSEVELT_IMAGE_ASSETS,
  ROOSEVELT_PLAYER_TEXTURE,
  ROOSEVELT_WALL_TEXTURES_BY_MAP,
  ROOSEVELT_WITNESS_TEXTURE_BY_ID,
  SCENE_SVG_ASSETS,
} from './sceneAssets';
import { createWalkabilityMatrix, findTilePath, type TilePoint } from './tilePathfinding';
import { ROOSEVELT_VISUAL_TARGET } from './visualTarget';
import { WORLD_MAPS, type WorldMapId } from './worldManifest';

type WorldBounds = { minX: number; minY: number; maxX: number; maxY: number };
type CameraKeys = Record<'W' | 'A' | 'S' | 'D' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT', Phaser.Input.Keyboard.Key>;

export class RooseveltScene extends Phaser.Scene {
  private tilemap?: Phaser.Tilemaps.Tilemap;
  private player?: Phaser.GameObjects.Container;
  private playerBody?: Phaser.GameObjects.Image;
  private playerTile?: TilePoint;
  private tooltip?: Phaser.GameObjects.Container;
  private objectiveText?: Phaser.GameObjects.Text;
  private cameraModeText?: Phaser.GameObjects.Text;
  private unsubscribeStore?: () => void;
  private walkabilityGrid: number[][] = [];
  private movementGeneration = 0;
  private ambienceStarted = false;
  private cameraDetached = false;
  private cameraDragging = false;
  private cameraDragX = 0;
  private cameraDragY = 0;
  private cameraKeys?: CameraKeys;
  private recenterKey?: Phaser.Input.Keyboard.Key;

  constructor(
    private readonly worldMapId: Exclude<WorldMapId, 'prototype-room-307'>,
    private readonly spawnId: string,
  ) {
    super('roosevelt-investigation');
  }

  preload() {
    this.load.tilemapTiledJSON('roosevelt-map', WORLD_MAPS[this.worldMapId].mapUrl);
    this.load.image('roosevelt-floor', ROOSEVELT_FLOOR_TEXTURE_BY_MAP[this.worldMapId]);
    for (const [key, url] of SCENE_SVG_ASSETS) this.load.svg(key, url);
    for (const [key, url] of ROOSEVELT_IMAGE_ASSETS) this.load.image(key, url);
    for (const asset of Object.values(GAME_AUDIO)) this.load.audio(asset.key, asset.url);
  }

  create() {
    this.cameras.main.setBackgroundColor(this.worldMapId === 'roosevelt-basement' ? '#080b09' : '#090805');
    this.sound.mute = !useInvestigationStore.getState().soundEnabled;
    this.input.mouse?.disableContextMenu();
    this.input.once('pointerdown', () => this.startAmbience());

    const map = this.make.tilemap({ key: 'roosevelt-map' });
    this.tilemap = map;
    const floorLayer = map.getLayer('Floor');
    const walkableLayer = map.getLayer('Walkable');
    if (!floorLayer || !walkableLayer) throw new Error(`${this.worldMapId} must contain Floor and Walkable tile layers`);

    this.renderFloor(floorLayer);

    const walkableTiles = new Set<string>();
    const worldBounds: WorldBounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    for (let tileY = 0; tileY < walkableLayer.data.length; tileY += 1) {
      const row = walkableLayer.data[tileY] ?? [];
      for (let tileX = 0; tileX < row.length; tileX += 1) {
        const tile = row[tileX];
        if (!tile || tile.index < 0) continue;
        walkableTiles.add(`${tileX}:${tileY}`);
        const point = this.tileToWorld(tileX, tileY);
        worldBounds.minX = Math.min(worldBounds.minX, point.x - 96);
        worldBounds.maxX = Math.max(worldBounds.maxX, point.x + 96);
        worldBounds.minY = Math.min(worldBounds.minY, point.y - 130);
        worldBounds.maxY = Math.max(worldBounds.maxY, point.y + 120);
      }
    }
    this.walkabilityGrid = createWalkabilityMatrix(map.width, map.height, (x, y) => walkableTiles.has(`${x}:${y}`));

    this.addArchitecture(walkableTiles, map.getObjectLayer('Zones')?.objects);

    const anchors = readEntityAnchors(map.getObjectLayer('Entities')?.objects);
    const playerAnchor = requireEntityAnchor(anchors, 'player', this.spawnId);
    this.assertWalkable(playerAnchor.tileX, playerAnchor.tileY, `player:${this.spawnId}`);
    this.createPlayer(playerAnchor.tileX, playerAnchor.tileY);
    this.configureCamera(worldBounds);
    this.setupCameraControls();

    this.addZoneLabels(map.getObjectLayer('Zones')?.objects);
    this.addWalkZones(walkableTiles);

    for (const clueId of WORLD_MAPS[this.worldMapId].clueIds) {
      const clue = clueById[clueId];
      if (!clue) throw new Error(`Unknown clue in ${this.worldMapId}: ${clueId}`);
      const anchor = requireEntityAnchor(anchors, 'clue', clueId);
      this.assertWalkable(anchor.tileX, anchor.tileY, `clue:${clueId}`);
      const point = this.tileToWorld(anchor.tileX, anchor.tileY);
      this.addClueHotspot(clueId, clue.title, anchor.tileX, anchor.tileY, point.x, point.y + 36);
    }

    for (const witnessId of WORLD_MAPS[this.worldMapId].witnessIds) {
      const witness = witnessById[witnessId];
      if (!witness) throw new Error(`Unknown witness in ${this.worldMapId}: ${witnessId}`);
      const anchor = requireEntityAnchor(anchors, 'witness', witnessId);
      this.assertWalkable(anchor.tileX, anchor.tileY, `witness:${witnessId}`);
      const point = this.tileToWorld(anchor.tileX, anchor.tileY);
      this.addWitness(witnessId, witness.name, witness.role, anchor.tileX, anchor.tileY, point.x, point.y + 52);
    }

    for (const transition of readMapTransitions(map.getObjectLayer('Transitions')?.objects)) {
      this.assertWalkable(transition.tileX, transition.tileY, `transition:${transition.id}`);
      this.addTransition(transition);
    }

    this.addHud();
    this.updateObjective(useInvestigationStore.getState().discoveredClueIds.length);
    this.unsubscribeStore = useInvestigationStore.subscribe((state, previous) => {
      if (state.discoveredClueIds.length !== previous.discoveredClueIds.length) this.updateObjective(state.discoveredClueIds.length);
      if (state.soundEnabled !== previous.soundEnabled) {
        this.sound.mute = !state.soundEnabled;
        if (state.soundEnabled) this.startAmbience();
      }
      if (totalContradictions(state.witnessProgress) > totalContradictions(previous.witnessProgress)) this.playAudio('contradiction');
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unsubscribeStore?.());
  }

  update(_time: number, delta: number) {
    if (!this.cameraKeys || !this.recenterKey) return;
    if (Phaser.Input.Keyboard.JustDown(this.recenterKey)) this.resumeCameraFollow();

    const left = this.cameraKeys.A.isDown || this.cameraKeys.LEFT.isDown;
    const right = this.cameraKeys.D.isDown || this.cameraKeys.RIGHT.isDown;
    const up = this.cameraKeys.W.isDown || this.cameraKeys.UP.isDown;
    const down = this.cameraKeys.S.isDown || this.cameraKeys.DOWN.isDown;
    if (!left && !right && !up && !down) return;

    this.detachCamera();
    const camera = this.cameras.main;
    const speed = (0.52 * delta) / camera.zoom;
    if (left) camera.scrollX -= speed;
    if (right) camera.scrollX += speed;
    if (up) camera.scrollY -= speed;
    if (down) camera.scrollY += speed;
  }

  private tileToWorld(tileX: number, tileY: number) {
    if (!this.tilemap) throw new Error('Roosevelt tilemap is not initialized');
    const point = this.tilemap.tileToWorldXY(tileX, tileY, undefined, undefined, 'Floor');
    if (!point) throw new Error(`Unable to project Roosevelt tile ${tileX}:${tileY}`);
    return point;
  }

  private renderFloor(layer: Phaser.Tilemaps.LayerData) {
    for (let tileY = 0; tileY < layer.data.length; tileY += 1) {
      const row = layer.data[tileY] ?? [];
      for (let tileX = 0; tileX < row.length; tileX += 1) {
        const tile = row[tileX];
        if (!tile || tile.index < 0) continue;
        const point = this.tileToWorld(tileX, tileY);
        this.add.image(point.x, point.y + 32, 'roosevelt-floor')
          .setOrigin(0.5)
          .setDisplaySize(128, 64)
          .setDepth(point.y - 20);
      }
    }
  }

  private assertWalkable(tileX: number, tileY: number, label: string) {
    if (this.walkabilityGrid[tileY]?.[tileX] !== 1) throw new Error(`${this.worldMapId} ${label} is not on Walkable`);
  }

  private addArchitecture(walkableTiles: Set<string>, objects: Parameters<typeof readMapZones>[0]) {
    const wallTextures = ROOSEVELT_WALL_TEXTURES_BY_MAP[this.worldMapId];
    const isWalkable = (x: number, y: number) => walkableTiles.has(`${x}:${y}`);

    for (let y = 0; y < this.walkabilityGrid.length; y += 1) {
      for (let x = 0; x < (this.walkabilityGrid[y]?.length ?? 0); x += 1) {
        if (!isWalkable(x, y)) continue;
        const point = this.tileToWorld(x, y);
        const wallDepth = point.y + 24;
        if (!isWalkable(x - 1, y)) {
          this.add.image(point.x, point.y + 32, wallTextures.nw)
            .setOrigin(0.5, 0.72)
            .setDisplaySize(ROOSEVELT_VISUAL_TARGET.wallDisplay.width, ROOSEVELT_VISUAL_TARGET.wallDisplay.height)
            .setDepth(wallDepth);
        }
        if (!isWalkable(x, y - 1)) {
          this.add.image(point.x, point.y + 32, wallTextures.ne)
            .setOrigin(0.5, 0.72)
            .setDisplaySize(ROOSEVELT_VISUAL_TARGET.wallDisplay.width, ROOSEVELT_VISUAL_TARGET.wallDisplay.height)
            .setDepth(wallDepth + 0.1);
        }
      }
    }

    for (const zone of readMapZones(objects)) {
      const point = this.tileToWorld(zone.tileX, zone.tileY);
      if (zone.id === 'room-307') {
        this.add.image(point.x + 46, point.y + 54, 'mockup-door307')
          .setOrigin(0.5, 1)
          .setDisplaySize(102, 184)
          .setDepth(point.y + 120);
      }
      if (zone.id === 'main-lobby') {
        this.add.image(point.x - 92, point.y + 118, 'mockup-reception')
          .setOrigin(0.5, 1)
          .setDisplaySize(310, 200)
          .setDepth(point.y + 142);
      }
      if (zone.id === 'laundry') {
        this.add.image(point.x + 96, point.y + 126, 'mockup-laundry')
          .setOrigin(0.5, 1)
          .setDisplaySize(260, 242)
          .setDepth(point.y + 148);
      }
      if (zone.id === 'service-hall' || zone.id === 'service-corridor') {
        this.add.image(point.x - 44, point.y + 76, 'prop-cart')
          .setOrigin(0.5, 1)
          .setDisplaySize(88, 82)
          .setDepth(point.y + 104)
          .setAlpha(0.9);
      }
      if (zone.id === 'guest-corridor-west' && this.worldMapId === 'roosevelt-floor-3') {
        this.add.image(point.x - 82, point.y + 124, 'mockup-stairs')
          .setOrigin(0.5, 1)
          .setDisplaySize(208, 236)
          .setDepth(point.y + 144)
          .setAlpha(0.96);
      }
      if (zone.id === 'guest-corridor-east' || zone.id === 'palm-room') {
        this.add.image(point.x + 40, point.y + 18, 'prop-window')
          .setOrigin(0.5, 1)
          .setDisplaySize(82, 72)
          .setDepth(point.y + 54)
          .setAlpha(0.86);
      }
    }
  }

  private configureCamera(bounds: WorldBounds) {
    if (!this.player || !Number.isFinite(bounds.minX)) return;
    const { x: paddingX, y: paddingY } = ROOSEVELT_VISUAL_TARGET.cameraPadding;
    const camera = this.cameras.main;
    camera.setBounds(
      bounds.minX - paddingX,
      bounds.minY - paddingY,
      bounds.maxX - bounds.minX + paddingX * 2,
      bounds.maxY - bounds.minY + paddingY * 2,
    );
    camera.setZoom(ROOSEVELT_VISUAL_TARGET.initialZoom);
    camera.setRoundPixels(true);
    camera.centerOn((bounds.minX + bounds.maxX) / 2, (bounds.minY + bounds.maxY) / 2);
    camera.stopFollow();
    this.cameraDetached = true;
  }

  private setupCameraControls() {
    const keyboard = this.input.keyboard;
    if (keyboard) {
      this.cameraKeys = keyboard.addKeys({
        W: Phaser.Input.Keyboard.KeyCodes.W,
        A: Phaser.Input.Keyboard.KeyCodes.A,
        S: Phaser.Input.Keyboard.KeyCodes.S,
        D: Phaser.Input.Keyboard.KeyCodes.D,
        UP: Phaser.Input.Keyboard.KeyCodes.UP,
        DOWN: Phaser.Input.Keyboard.KeyCodes.DOWN,
        LEFT: Phaser.Input.Keyboard.KeyCodes.LEFT,
        RIGHT: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      }) as CameraKeys;
      this.recenterKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    }

    this.input.on('wheel', (pointer: Phaser.Input.Pointer, _objects: Phaser.GameObjects.GameObject[], _deltaX: number, deltaY: number) => {
      const camera = this.cameras.main;
      const before = camera.getWorldPoint(pointer.x, pointer.y);
      this.detachCamera();
      camera.setZoom(Phaser.Math.Clamp(camera.zoom - deltaY * 0.0009, 0.5, 1.5));
      const after = camera.getWorldPoint(pointer.x, pointer.y);
      camera.scrollX += before.x - after.x;
      camera.scrollY += before.y - after.y;
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.rightButtonDown() && !pointer.middleButtonDown()) return;
      this.detachCamera();
      this.cameraDragging = true;
      this.cameraDragX = pointer.x;
      this.cameraDragY = pointer.y;
    });
    this.input.on('pointerup', () => { this.cameraDragging = false; });
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.cameraDragging) return;
      const camera = this.cameras.main;
      camera.scrollX -= (pointer.x - this.cameraDragX) / camera.zoom;
      camera.scrollY -= (pointer.y - this.cameraDragY) / camera.zoom;
      this.cameraDragX = pointer.x;
      this.cameraDragY = pointer.y;
    });
  }

  private detachCamera() {
    if (this.cameraDetached) return;
    this.cameraDetached = true;
    this.cameras.main.stopFollow();
    this.cameraModeText?.setText('CAMERA FREE · F = FOLLOW DETECTIVE');
  }

  private resumeCameraFollow() {
    if (!this.player) return;
    this.cameraDetached = false;
    this.cameras.main.centerOn(this.player.x, this.player.y);
    this.cameras.main.setDeadzone(210, 130);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameraModeText?.setText('CAMERA FOLLOW · RMB/MMB DRAG · WHEEL ZOOM · WASD/ARROWS PAN');
  }

  private addZoneLabels(objects: Parameters<typeof readMapZones>[0]) {
    for (const zone of readMapZones(objects)) {
      const point = this.tileToWorld(zone.tileX, zone.tileY);
      this.add.text(point.x, point.y + 28, zone.label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '10px',
        color: '#c7b790',
        backgroundColor: '#11100ddc',
        padding: { x: 5, y: 3 },
      }).setOrigin(0.5).setDepth(point.y + 150).setAlpha(0.82);
    }
  }

  private addWalkZones(walkableTiles: Set<string>) {
    for (const tileKey of walkableTiles) {
      const [tileX, tileY] = tileKey.split(':').map(Number);
      const point = this.tileToWorld(tileX, tileY);
      const zone = this.add.zone(point.x, point.y + 32, 112, 54).setInteractive({ useHandCursor: true }).setDepth(-1);
      zone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (pointer.leftButtonDown()) this.walkToTile(tileX, tileY);
      });
    }
  }

  private createPlayer(tileX: number, tileY: number) {
    const start = this.tileToWorld(tileX, tileY);
    const shadow = this.add.ellipse(0, 0, 48, 17, 0x000000, 0.54);
    const body = this.add.image(0, -66, ROOSEVELT_PLAYER_TEXTURE).setDisplaySize(78, 130);
    this.playerBody = body;
    this.playerTile = { x: tileX, y: tileY };
    this.player = this.add.container(start.x, start.y + 56, [shadow, body]).setDepth(start.y + 150).setName('detective');
  }

  private walkToTile(tileX: number, tileY: number, onArrive?: () => void) {
    if (!this.player || !this.playerTile) return;
    const path = findTilePath(this.walkabilityGrid, this.playerTile, { x: tileX, y: tileY });
    if (!path.length && (this.playerTile.x !== tileX || this.playerTile.y !== tileY)) {
      this.flashMessage('NO WALKABLE ROUTE', '#d7a0a0');
      return;
    }
    if (this.playerTile.x === tileX && this.playerTile.y === tileY) {
      onArrive?.();
      return;
    }

    const generation = ++this.movementGeneration;
    this.tweens.killTweensOf(this.player);
    if (this.playerBody) this.tweens.killTweensOf(this.playerBody);
    this.followPath(path.slice(1), 0, generation, onArrive);
  }

  private followPath(path: TilePoint[], index: number, generation: number, onArrive?: () => void) {
    if (!this.player || generation !== this.movementGeneration) return;
    if (index >= path.length) {
      this.playerBody?.setY(-66);
      onArrive?.();
      return;
    }

    const next = path[index];
    const point = this.tileToWorld(next.x, next.y);
    const x = point.x;
    const y = point.y + 56;
    const duration = Phaser.Math.Clamp(Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y) * 2.5, 90, 260);
    if (this.playerBody) {
      this.playerBody.setFlipX(x < this.player.x);
      this.tweens.add({ targets: this.playerBody, y: -70, duration: Math.max(55, duration / 2), yoyo: true });
    }
    this.tweens.add({
      targets: this.player,
      x,
      y,
      duration,
      ease: 'Linear',
      onUpdate: () => this.player?.setDepth((this.player?.y ?? y) + 150),
      onComplete: () => {
        if (generation !== this.movementGeneration) return;
        this.playerTile = next;
        this.followPath(path, index + 1, generation, onArrive);
      },
    });
  }

  private addClueHotspot(id: string, title: string, tileX: number, tileY: number, x: number, y: number) {
    const discovered = useInvestigationStore.getState().discoveredClueIds.includes(id);
    const ring = this.add.ellipse(x, y, 62, 25, discovered ? 0x7b837a : 0xc2a76a, discovered ? 0.05 : 0.09)
      .setStrokeStyle(1.5, discovered ? 0x858b84 : 0xd0b775, discovered ? 0.24 : 0.58).setDepth(y + 92);
    const image = this.add.image(x, y - 20, CLUE_TEXTURE_BY_ID[id]).setDisplaySize(52, 52).setDepth(y + 96).setAlpha(discovered ? 0.72 : 0.96);
    const hit = this.add.zone(x, y - 20, 70, 66).setInteractive({ useHandCursor: true }).setDepth(y + 102);
    if (!discovered) this.tweens.add({ targets: ring, alpha: { from: 0.28, to: 0.72 }, duration: 1450, yoyo: true, repeat: -1 });

    hit.on('pointerover', (pointer: Phaser.Input.Pointer) => {
      image.setScale(1.08);
      this.showTooltip(discovered ? `${title} · logged` : title, pointer.worldX, pointer.worldY - 36);
    });
    hit.on('pointerout', () => { image.setScale(1); this.hideTooltip(); });
    hit.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.leftButtonDown()) return;
      this.walkToTile(tileX, tileY, () => {
        const wasDiscovered = useInvestigationStore.getState().discoveredClueIds.includes(id);
        useInvestigationStore.getState().discoverClue(id);
        if (!wasDiscovered) {
          for (const audio of audioForNewClue(id)) this.playAudio(audio);
          this.tweens.killTweensOf(ring);
          ring.setAlpha(0.28);
          image.setAlpha(0.72);
          this.flashMessage('EVIDENCE LOGGED', '#f0cf88');
        }
      });
    });
  }

  private addWitness(id: string, name: string, role: string, tileX: number, tileY: number, x: number, y: number) {
    const shadow = this.add.ellipse(x, y, 48, 17, 0x000000, 0.54).setDepth(y + 88);
    const texture = ROOSEVELT_WITNESS_TEXTURE_BY_ID[id] ?? 'npc-nina';
    const body = this.add.image(x, y, texture).setOrigin(0.5, 1).setDisplaySize(76, 128).setDepth(y + 96);
    const label = this.add.text(x, y + 8, name.split(' ')[0], {
      fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#e7ddca', backgroundColor: '#0c0d0be8', padding: { x: 5, y: 3 },
    }).setOrigin(0.5).setDepth(y + 108);
    const hit = this.add.zone(x, y - 58, 78, 128).setInteractive({ useHandCursor: true }).setDepth(y + 110);
    hit.on('pointerover', (pointer: Phaser.Input.Pointer) => {
      body.setScale(1.05); shadow.setScale(1.08); label.setColor('#f2d899');
      this.showTooltip(`${name} · ${role}`, pointer.worldX, pointer.worldY - 70);
    });
    hit.on('pointerout', () => { body.setScale(1); shadow.setScale(1); label.setColor('#e7ddca'); this.hideTooltip(); });
    hit.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) this.walkToTile(tileX, tileY, () => useInvestigationStore.getState().selectWitness(id));
    });
  }

  private addTransition(transition: MapTransition) {
    const point = this.tileToWorld(transition.tileX, transition.tileY);
    const elevator = this.add.image(point.x, point.y + 54, 'mockup-elevator')
      .setOrigin(0.5, 1)
      .setDisplaySize(124, 240)
      .setDepth(point.y + 104)
      .setAlpha(0.98);
    const marker = this.add.text(point.x, point.y + 16, '⇅', {
      fontFamily: 'Arial, sans-serif', fontSize: '15px', color: '#e0c47d', backgroundColor: '#10100ce8', padding: { x: 6, y: 3 },
    }).setOrigin(0.5).setDepth(point.y + 132);
    const hit = this.add.zone(point.x, point.y - 42, 118, 222).setInteractive({ useHandCursor: true }).setDepth(point.y + 134);
    hit.on('pointerover', (pointer: Phaser.Input.Pointer) => {
      elevator.setTint(0xffe7ae); marker.setColor('#ffe0a0'); this.showTooltip(transition.label, pointer.worldX, pointer.worldY - 48);
    });
    hit.on('pointerout', () => { elevator.clearTint(); marker.setColor('#e0c47d'); this.hideTooltip(); });
    hit.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) this.walkToTile(transition.tileX, transition.tileY, () => useWorldStore.getState().navigate(transition.targetMap, transition.targetSpawn));
    });
  }

  private addHud() {
    const map = WORLD_MAPS[this.worldMapId];
    this.add.text(26, 24, `HOTEL NOCTURNE / ${map.title.toUpperCase()}`, {
      fontFamily: 'Georgia, serif', fontSize: '20px', color: '#e1c98d', backgroundColor: '#090a07e3', padding: { x: 8, y: 5 },
    }).setScrollFactor(0).setDepth(30000);
    this.add.text(26, 58, 'ROOSEVELT HOTEL 1925 · MOCKUP-GUIDED ISOMETRIC RECONSTRUCTION', {
      fontFamily: 'Arial, sans-serif', fontSize: '9px', color: '#93917c', letterSpacing: 1,
    }).setScrollFactor(0).setDepth(30000);
    this.objectiveText = this.add.text(996, 26, '', {
      fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#d0b36f', align: 'right', backgroundColor: '#090a07e3', padding: { x: 7, y: 5 },
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(30000);
    this.cameraModeText = this.add.text(26, 607, 'CAMERA FREE · F = FOLLOW DETECTIVE · RMB/MMB DRAG · WHEEL ZOOM · WASD/ARROWS PAN', {
      fontFamily: 'Arial, sans-serif', fontSize: '9px', color: '#b9b5a2', backgroundColor: '#090a07de', padding: { x: 7, y: 5 },
    }).setScrollFactor(0).setDepth(30000);
  }

  private updateObjective(found: number) {
    this.objectiveText?.setText(found >= 7 ? 'ALL EVIDENCE LOGGED · BUILD THE CASE' : `EVIDENCE ${found}/7 · SEARCH EVERY LEVEL`);
  }

  private flashMessage(textValue: string, color: string) {
    const text = this.add.text(512, 185, textValue, {
      fontFamily: 'Arial, sans-serif', fontSize: '10px', fontStyle: 'bold', color, backgroundColor: '#090a08e8', padding: { x: 7, y: 4 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(31000);
    this.tweens.add({ targets: text, y: text.y - 16, alpha: 0, duration: 1000, onComplete: () => text.destroy() });
  }

  private showTooltip(textValue: string, x: number, y: number) {
    this.hideTooltip();
    const text = this.add.text(0, 0, textValue, {
      fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#f0e4ca', backgroundColor: '#090a08f2', padding: { x: 9, y: 6 },
    }).setOrigin(0.5);
    this.tooltip = this.add.container(x, y, [text]).setDepth(32000);
  }

  private hideTooltip() {
    this.tooltip?.destroy(true);
    this.tooltip = undefined;
  }

  private startAmbience() {
    if (this.ambienceStarted) return;
    this.ambienceStarted = true;
    for (const name of ['rain', 'hotelHum'] as const) {
      const asset = GAME_AUDIO[name];
      if (this.cache.audio.exists(asset.key)) this.sound.play(asset.key, { loop: true, volume: asset.volume });
    }
    this.time.addEvent({ delay: 18000, loop: true, callback: () => { if (Math.random() < 0.5) this.playAudio('thunder'); } });
  }

  private playAudio(name: GameAudioName) {
    const asset = GAME_AUDIO[name];
    if (this.cache.audio.exists(asset.key)) this.sound.play(asset.key, { volume: asset.volume });
  }
}
