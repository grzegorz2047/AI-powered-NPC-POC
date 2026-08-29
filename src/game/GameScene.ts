import Phaser from 'phaser';
import { GAME_AUDIO, audioForNewClue, totalContradictions, type GameAudioName } from '../audio/gameAudio';
import { clueById, clues, witnessById, witnesses } from '../data/caseData';
import { useInvestigationStore } from '../state/investigationStore';
import { useWorldStore } from '../state/worldStore';
import { mapAnchorKey, readEntityAnchors, requireEntityAnchor } from './mapEntities';
import { readMapTransitions, type MapTransition } from './mapTransitions';
import { CLUE_TEXTURE_BY_ID, SCENE_SVG_ASSETS, WITNESS_TEXTURE_BY_ID } from './sceneAssets';
import { createWalkabilityMatrix, findTilePath, type TilePoint } from './tilePathfinding';
import { DEFAULT_WORLD_MAP, WORLD_MAPS, type WorldMapId } from './worldManifest';

const FLOOR_OFFSET_X = 510;
const FLOOR_OFFSET_Y = 95;

type SceneFloorLayer = Phaser.Tilemaps.TilemapLayer | Phaser.Tilemaps.TilemapGPULayer;

export class GameScene extends Phaser.Scene {
  private tooltip?: Phaser.GameObjects.Container;
  private player?: Phaser.GameObjects.Container;
  private playerBody?: Phaser.GameObjects.Image;
  private playerTile?: TilePoint;
  private objectiveText?: Phaser.GameObjects.Text;
  private unsubscribeStore?: () => void;
  private ambienceStarted = false;
  private walkabilityGrid: number[][] = [];
  private movementGeneration = 0;

  constructor(
    private readonly worldMapId: WorldMapId = DEFAULT_WORLD_MAP,
    private readonly spawnId: string = 'detective',
  ) {
    super('investigation');
  }

  preload() {
    const worldMap = WORLD_MAPS[this.worldMapId];
    this.load.tilemapTiledJSON('hotel-map', worldMap.mapUrl);
    this.load.svg('nocturne-floor', '/assets/nocturne-floor.svg', { width: 128, height: 64 });
    for (const [key, url] of SCENE_SVG_ASSETS) this.load.svg(key, url);
    for (const asset of Object.values(GAME_AUDIO)) this.load.audio(asset.key, asset.url);
  }

  create() {
    this.cameras.main.setBackgroundColor('#05080d');
    this.sound.mute = !useInvestigationStore.getState().soundEnabled;
    this.input.once('pointerdown', () => this.startAmbience());

    const map = this.make.tilemap({ key: 'hotel-map' });
    const tileset = map.addTilesetImage('nocturne-floor', 'nocturne-floor');
    const floor = map.createLayer('Floor', tileset!, FLOOR_OFFSET_X, FLOOR_OFFSET_Y);
    if (!floor) throw new Error('Tiled map is missing required Floor layer.');
    floor.setAlpha(0.98).setDepth(-2);

    const walkable = map.createLayer('Walkable', tileset!, FLOOR_OFFSET_X, FLOOR_OFFSET_Y);
    if (!walkable) throw new Error('Tiled map is missing required Walkable layer.');
    walkable.setVisible(false);

    const walkableTiles = new Set<string>();
    walkable.forEachTile((tile) => {
      if (tile.index >= 0) walkableTiles.add(`${tile.x}:${tile.y}`);
    });
    this.walkabilityGrid = createWalkabilityMatrix(map.width, map.height, (x, y) => walkableTiles.has(`${x}:${y}`));

    const anchors = readEntityAnchors(map.getObjectLayer('Entities')?.objects);
    const requireWalkableAnchor = (kind: 'clue' | 'witness' | 'player', entityId: string) => {
      const anchor = requireEntityAnchor(anchors, kind, entityId);
      if (this.walkabilityGrid[anchor.tileY]?.[anchor.tileX] !== 1) {
        throw new Error(`Tiled ${kind} anchor is not on a Walkable tile: ${entityId}`);
      }
      return anchor;
    };

    this.addHotelShell();
    this.addEnvironmentProps();
    this.addRoomLabels();
    this.addWalkZones(floor, walkable);

    const playerAnchor = requireWalkableAnchor('player', this.spawnId);
    this.createPlayer(floor, playerAnchor.tileX, playerAnchor.tileY);

    for (const clue of clues) {
      const anchor = anchors.get(mapAnchorKey('clue', clue.id));
      if (!anchor) continue;
      if (this.walkabilityGrid[anchor.tileY]?.[anchor.tileX] !== 1) {
        throw new Error(`Tiled clue anchor is not on a Walkable tile: ${clue.id}`);
      }
      const point = floor.tileToWorldXY(anchor.tileX, anchor.tileY);
      this.addClueHotspot(floor, clue.id, clue.title, anchor.tileX, anchor.tileY, point.x, point.y + 36);
    }

    for (const witness of witnesses) {
      const anchor = anchors.get(mapAnchorKey('witness', witness.id));
      if (!anchor) continue;
      if (this.walkabilityGrid[anchor.tileY]?.[anchor.tileX] !== 1) {
        throw new Error(`Tiled witness anchor is not on a Walkable tile: ${witness.id}`);
      }
      const point = floor.tileToWorldXY(anchor.tileX, anchor.tileY);
      this.addWitness(floor, witness.id, witness.name, witness.role, anchor.tileX, anchor.tileY, point.x, point.y + 50);
    }

    for (const transition of readMapTransitions(map.getObjectLayer('Transitions')?.objects)) {
      if (this.walkabilityGrid[transition.tileY]?.[transition.tileX] !== 1) {
        throw new Error(`Tiled transition is not on a Walkable tile: ${transition.id}`);
      }
      this.addTransition(floor, transition);
    }

    this.addHud();
    this.updateObjective(useInvestigationStore.getState().discoveredClueIds.length);
    this.unsubscribeStore = useInvestigationStore.subscribe((state, previous) => {
      if (state.discoveredClueIds.length !== previous.discoveredClueIds.length) {
        this.updateObjective(state.discoveredClueIds.length);
      }
      if (state.soundEnabled !== previous.soundEnabled) {
        this.sound.mute = !state.soundEnabled;
        if (state.soundEnabled) this.startAmbience();
      }
      if (totalContradictions(state.witnessProgress) > totalContradictions(previous.witnessProgress)) {
        this.playAudio('contradiction');
      }
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unsubscribeStore?.());
  }

  private startAmbience() {
    if (this.ambienceStarted) return;
    this.ambienceStarted = true;

    for (const name of ['rain', 'hotelHum'] as const) {
      const asset = GAME_AUDIO[name];
      if (this.cache.audio.exists(asset.key)) {
        this.sound.play(asset.key, { loop: true, volume: asset.volume });
      }
    }

    this.time.addEvent({
      delay: 18000,
      loop: true,
      callback: () => {
        if (Math.random() < 0.5) this.playAudio('thunder');
      },
    });
  }

  private playAudio(name: GameAudioName) {
    const asset = GAME_AUDIO[name];
    if (!this.cache.audio.exists(asset.key)) return;
    this.sound.play(asset.key, { loop: false, volume: asset.volume });
  }

  private addHotelShell() {
    const shell = this.add.graphics().setDepth(-5);
    shell.fillStyle(0x0d1218, 0.96);
    shell.fillRoundedRect(200, 110, 630, 420, 10);
    shell.lineStyle(3, 0x493b2d, 0.95);
    shell.strokeRoundedRect(200, 110, 630, 420, 10);

    shell.fillStyle(0x161a20, 1);
    shell.fillRect(205, 115, 620, 86);
    shell.lineStyle(2, 0x8a6b3f, 0.32);
    shell.lineBetween(205, 201, 825, 201);

    shell.lineStyle(2, 0x67543b, 0.48);
    shell.lineBetween(390, 201, 390, 515);
    shell.lineBetween(630, 201, 630, 515);
    shell.lineBetween(205, 344, 825, 344);

    shell.fillStyle(0x5a3a3e, 0.28);
    shell.fillRect(222, 330, 590, 20);
    shell.fillStyle(0x161d22, 0.55);
    shell.fillRect(635, 350, 175, 163);

    const lampXs = [265, 515, 755];
    lampXs.forEach((x) => {
      const glow = this.add.circle(x, 192, 34, 0xd2a45b, 0.045).setDepth(-3);
      const lamp = this.add.circle(x, 192, 5, 0xd9aa5c, 0.72).setDepth(-2);
      this.tweens.add({ targets: glow, alpha: { from: 0.025, to: 0.065 }, duration: 2400 + x, yoyo: true, repeat: -1 });
      lamp.setStrokeStyle(1, 0x5c472d, 0.9);
    });
  }

  private addEnvironmentProps() {
    this.add.image(285, 458, 'prop-reception').setOrigin(0.5, 1).setDisplaySize(150, 88).setDepth(458);
    this.add.image(510, 226, 'prop-door307').setOrigin(0.5, 1).setDisplaySize(62, 100).setDepth(226);
    this.add.image(735, 235, 'prop-cctv').setOrigin(0.5, 1).setDisplaySize(95, 75).setDepth(235);
    this.add.image(694, 486, 'prop-cart').setOrigin(0.5, 1).setDisplaySize(94, 80).setDepth(486);
    this.add.image(774, 492, 'prop-laundry').setOrigin(0.5, 1).setDisplaySize(67, 60).setDepth(492);
    this.add.image(298, 174, 'prop-window').setDisplaySize(112, 64).setDepth(-1);
    this.add.image(720, 174, 'prop-window').setDisplaySize(112, 64).setDepth(-1);
  }

  private addWalkZones(floor: SceneFloorLayer, walkable: SceneFloorLayer) {
    walkable.forEachTile((tile) => {
      if (tile.index < 0) return;
      const point = floor.tileToWorldXY(tile.x, tile.y);
      const zone = this.add.zone(point.x, point.y + 32, 112, 54)
        .setInteractive({ useHandCursor: true })
        .setDepth(-1);
      zone.on('pointerdown', () => this.walkToTile(floor, tile.x, tile.y));
    });
  }

  private createPlayer(floor: SceneFloorLayer, tileX: number, tileY: number) {
    const start = floor.tileToWorldXY(tileX, tileY);
    const shadow = this.add.ellipse(0, 0, 36, 13, 0x000000, 0.34);
    const body = this.add.image(0, -48, 'detective').setDisplaySize(50, 88);
    this.playerBody = body;
    this.playerTile = { x: tileX, y: tileY };
    this.player = this.add.container(start.x, start.y + 52, [shadow, body]).setDepth(start.y + 130);
  }

  private walkToTile(floor: SceneFloorLayer, tileX: number, tileY: number, onArrive?: () => void) {
    if (!this.player || !this.playerTile) return;

    const path = findTilePath(this.walkabilityGrid, this.playerTile, { x: tileX, y: tileY });
    if (!path.length) {
      this.flashRouteBlocked();
      return;
    }

    const destination = floor.tileToWorldXY(tileX, tileY);
    const marker = this.add.ellipse(destination.x, destination.y + 54, 24, 10, 0xd1ae68, 0.16)
      .setStrokeStyle(1, 0xd1ae68, 0.42)
      .setDepth(destination.y + 20);
    this.tweens.add({ targets: marker, alpha: 0, scaleX: 1.7, scaleY: 1.7, duration: 520, onComplete: () => marker.destroy() });

    const generation = ++this.movementGeneration;
    this.tweens.killTweensOf(this.player);
    if (this.playerBody) this.tweens.killTweensOf(this.playerBody);
    this.followTilePath(floor, path.slice(1), 0, generation, onArrive);
  }

  private followTilePath(
    floor: SceneFloorLayer,
    path: TilePoint[],
    index: number,
    generation: number,
    onArrive?: () => void,
  ) {
    if (!this.player || generation !== this.movementGeneration) return;
    if (index >= path.length) {
      this.playerBody?.setY(-48);
      onArrive?.();
      return;
    }

    const next = path[index];
    const point = floor.tileToWorldXY(next.x, next.y);
    const x = point.x;
    const y = point.y + 52;
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y);
    const duration = Phaser.Math.Clamp(distance * 2.5, 90, 260);

    if (this.playerBody) {
      this.playerBody.setFlipX(x < this.player.x);
      this.tweens.add({ targets: this.playerBody, y: -52, duration: Math.max(55, duration / 2), yoyo: true });
    }

    this.tweens.add({
      targets: this.player,
      x,
      y,
      duration,
      ease: 'Linear',
      onUpdate: () => this.player?.setDepth((this.player?.y ?? y) + 130),
      onComplete: () => {
        if (generation !== this.movementGeneration) return;
        this.playerTile = next;
        this.followTilePath(floor, path, index + 1, generation, onArrive);
      },
    });
  }

  private flashRouteBlocked() {
    const text = this.add.text(512, 92, 'NO WALKABLE ROUTE', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      color: '#d7a0a0',
      backgroundColor: '#0b0e12e6',
      padding: { x: 7, y: 4 },
    }).setOrigin(0.5).setDepth(22000);
    this.tweens.add({ targets: text, alpha: 0, duration: 900, delay: 350, onComplete: () => text.destroy() });
  }

  private addTransition(floor: SceneFloorLayer, transition: MapTransition) {
    const point = floor.tileToWorldXY(transition.tileX, transition.tileY);
    const marker = this.add.text(point.x, point.y + 16, '⇅', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      color: '#d5b66f',
      backgroundColor: '#10141bcc',
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5).setDepth(point.y + 4);
    const hit = this.add.zone(point.x, point.y + 18, 68, 50).setInteractive({ useHandCursor: true }).setDepth(point.y + 6);

    hit.on('pointerover', (pointer: Phaser.Input.Pointer) => {
      marker.setColor('#ffe3a0');
      this.showTooltip(transition.label, pointer.worldX, pointer.worldY - 38);
    });
    hit.on('pointerout', () => {
      marker.setColor('#d5b66f');
      this.hideTooltip();
    });
    hit.on('pointerdown', () => {
      this.walkToTile(floor, transition.tileX, transition.tileY, () => {
        useWorldStore.getState().navigate(transition.targetMap, transition.targetSpawn);
      });
    });
  }

  private addClueHotspot(
    floor: SceneFloorLayer,
    id: string,
    title: string,
    tileX: number,
    tileY: number,
    x: number,
    y: number,
  ) {
    const texture = CLUE_TEXTURE_BY_ID[id];
    const discovered = useInvestigationStore.getState().discoveredClueIds.includes(id);
    const ring = this.add.ellipse(x, y, 60, 25, discovered ? 0x748178 : 0xcaa45c, discovered ? 0.06 : 0.1)
      .setStrokeStyle(1.5, discovered ? 0x87928a : 0xd2b06c, discovered ? 0.22 : 0.54)
      .setDepth(y - 1);
    const image = this.add.image(x, y - 20, texture).setDisplaySize(48, 48).setDepth(y + 1);
    const hit = this.add.zone(x, y - 20, 66, 62).setInteractive({ useHandCursor: true }).setDepth(y + 5);

    if (!discovered) {
      this.tweens.add({ targets: ring, alpha: { from: 0.42, to: 0.82 }, scaleX: { from: 0.94, to: 1.06 }, scaleY: { from: 0.94, to: 1.06 }, duration: 1250, yoyo: true, repeat: -1 });
    } else {
      ring.setAlpha(0.32);
      image.setAlpha(0.72);
    }

    hit.on('pointerover', (pointer: Phaser.Input.Pointer) => {
      image.setScale(1.08);
      ring.setStrokeStyle(2, 0xe6c276, discovered ? 0.4 : 0.9);
      this.showTooltip(discovered ? `${title} · already logged` : title, pointer.worldX, pointer.worldY - 38);
    });
    hit.on('pointerout', () => {
      image.setScale(1);
      ring.setStrokeStyle(1.5, discovered ? 0x87928a : 0xd2b06c, discovered ? 0.22 : 0.54);
      this.hideTooltip();
    });
    hit.on('pointerdown', () => {
      this.walkToTile(floor, tileX, tileY, () => {
        const wasDiscovered = useInvestigationStore.getState().discoveredClueIds.includes(id);
        useInvestigationStore.getState().discoverClue(id);
        if (!wasDiscovered) {
          for (const audio of audioForNewClue(id)) this.playAudio(audio);
          this.tweens.killTweensOf(ring);
          ring.setAlpha(0.3).setScale(1);
          image.setAlpha(0.76);
          this.flashEvidenceAdded(x, y - 48);
        }
      });
    });
  }

  private addWitness(
    floor: SceneFloorLayer,
    id: string,
    name: string,
    role: string,
    tileX: number,
    tileY: number,
    x: number,
    y: number,
  ) {
    const texture = WITNESS_TEXTURE_BY_ID[id];
    const shadow = this.add.ellipse(x, y, 38, 13, 0x000000, 0.34).setDepth(y - 2);
    const body = this.add.image(x, y, texture).setOrigin(0.5, 1).setDisplaySize(54, 97).setDepth(y + 1);
    const hit = this.add.zone(x, y - 47, 64, 102).setInteractive({ useHandCursor: true }).setDepth(y + 5);
    const label = this.add.text(x, y + 7, name.split(' ')[0], {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      color: '#dce2e9',
      backgroundColor: '#090d13d9',
      padding: { x: 5, y: 3 },
    }).setOrigin(0.5).setDepth(y + 6);

    hit.on('pointerover', (pointer: Phaser.Input.Pointer) => {
      body.setScale(1.055);
      shadow.setScale(1.08);
      label.setColor('#ffe5a7');
      this.showTooltip(`${name} · ${role}`, pointer.worldX, pointer.worldY - 70);
    });
    hit.on('pointerout', () => {
      body.setScale(1);
      shadow.setScale(1);
      label.setColor('#dce2e9');
      this.hideTooltip();
    });
    hit.on('pointerdown', () => {
      this.walkToTile(floor, tileX, tileY, () => useInvestigationStore.getState().selectWitness(id));
    });
  }

  private addRoomLabels() {
    const labels = [
      ['RECEPTION', 280, 505],
      ['ROOM 307', 500, 252],
      ['SERVICE', 700, 505],
      ['CCTV', 740, 260],
    ] as const;
    labels.forEach(([label, x, y]) => {
      this.add.text(x, y, label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '10px',
        color: '#66717d',
        letterSpacing: 1,
      }).setOrigin(0.5).setDepth(y + 3);
    });
  }

  private addHud() {
    const title = WORLD_MAPS[this.worldMapId].title;
    this.add.text(30, 26, `HOTEL NOCTURNE / ${title.toUpperCase()}`, {
      fontFamily: 'Georgia, serif',
      fontSize: '22px',
      color: '#e4c784',
      letterSpacing: 2,
    }).setScrollFactor(0).setDepth(20000);
    this.add.text(30, 57, 'Click the floor to move. Click a clue or witness to follow a walkable route.', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#8995a6',
    }).setScrollFactor(0).setDepth(20000);
    this.objectiveText = this.add.text(994, 30, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      color: '#d6b873',
      align: 'right',
      backgroundColor: '#070a0fc7',
      padding: { x: 8, y: 5 },
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(20000);
  }

  private updateObjective(found: number) {
    if (!this.objectiveText) return;
    this.objectiveText.setText(found >= clues.length ? 'ALL CLUES LOGGED · BUILD THE CASE' : `EVIDENCE ${found}/${clues.length} · QUESTION EVERYONE`);
  }

  private flashEvidenceAdded(x: number, y: number) {
    const text = this.add.text(x, y, 'EVIDENCE LOGGED', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#f2d28e',
      backgroundColor: '#0b0e12e6',
      padding: { x: 6, y: 4 },
    }).setOrigin(0.5).setDepth(15000);
    this.tweens.add({ targets: text, y: y - 20, alpha: 0, duration: 1100, ease: 'Cubic.easeOut', onComplete: () => text.destroy() });
  }

  private showTooltip(text: string, x: number, y: number) {
    this.hideTooltip();
    const clampedX = Phaser.Math.Clamp(x, 110, 910);
    const clampedY = Phaser.Math.Clamp(y, 95, 575);
    const label = this.add.text(0, 0, text, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#f5ead0',
      backgroundColor: '#090c12f2',
      padding: { x: 9, y: 6 },
    }).setOrigin(0.5);
    this.tooltip = this.add.container(clampedX, clampedY, [label]).setDepth(30000);
  }

  private hideTooltip() {
    this.tooltip?.destroy(true);
    this.tooltip = undefined;
  }
}
