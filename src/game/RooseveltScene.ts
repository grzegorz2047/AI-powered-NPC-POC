import Phaser from 'phaser';
import { GAME_AUDIO, audioForNewClue, totalContradictions, type GameAudioName } from '../audio/gameAudio';
import { clueById, witnessById } from '../data/caseData';
import { useInvestigationStore } from '../state/investigationStore';
import { useWorldStore } from '../state/worldStore';
import { readEntityAnchors, requireEntityAnchor } from './mapEntities';
import { readMapTransitions, type MapTransition } from './mapTransitions';
import { readMapZones } from './mapZones';
import { CLUE_TEXTURE_BY_ID, SCENE_SVG_ASSETS, WITNESS_TEXTURE_BY_ID } from './sceneAssets';
import { createWalkabilityMatrix, findTilePath, type TilePoint } from './tilePathfinding';
import { WORLD_MAPS, type WorldMapId } from './worldManifest';

type FloorLayer = Phaser.Tilemaps.TilemapLayer | Phaser.Tilemaps.TilemapGPULayer;

type WorldBounds = { minX: number; minY: number; maxX: number; maxY: number };

export class RooseveltScene extends Phaser.Scene {
  private player?: Phaser.GameObjects.Container;
  private playerBody?: Phaser.GameObjects.Image;
  private playerTile?: TilePoint;
  private tooltip?: Phaser.GameObjects.Container;
  private objectiveText?: Phaser.GameObjects.Text;
  private unsubscribeStore?: () => void;
  private walkabilityGrid: number[][] = [];
  private movementGeneration = 0;
  private ambienceStarted = false;

  constructor(
    private readonly worldMapId: Exclude<WorldMapId, 'prototype-room-307'>,
    private readonly spawnId: string,
  ) {
    super('roosevelt-investigation');
  }

  preload() {
    this.load.tilemapTiledJSON('roosevelt-map', WORLD_MAPS[this.worldMapId].mapUrl);
    this.load.svg('roosevelt-floor', '/assets/roosevelt-floor.svg', { width: 128, height: 64 });
    for (const [key, url] of SCENE_SVG_ASSETS) this.load.svg(key, url);
    for (const asset of Object.values(GAME_AUDIO)) this.load.audio(asset.key, asset.url);
  }

  create() {
    this.cameras.main.setBackgroundColor('#080806');
    this.sound.mute = !useInvestigationStore.getState().soundEnabled;
    this.input.once('pointerdown', () => this.startAmbience());

    const map = this.make.tilemap({ key: 'roosevelt-map' });
    const tileset = map.addTilesetImage('nocturne-floor', 'roosevelt-floor');
    if (!tileset) throw new Error(`Unable to bind Roosevelt floor tileset for ${this.worldMapId}`);

    const floor = map.createLayer('Floor', tileset, 0, 0);
    const walkable = map.createLayer('Walkable', tileset, 0, 0);
    if (!floor || !walkable) throw new Error(`${this.worldMapId} must contain Floor and Walkable tile layers`);
    floor.setDepth(-10);
    walkable.setVisible(false);

    const walkableTiles = new Set<string>();
    const worldBounds: WorldBounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    walkable.forEachTile((tile) => {
      if (tile.index < 0) return;
      walkableTiles.add(`${tile.x}:${tile.y}`);
      const point = floor.tileToWorldXY(tile.x, tile.y);
      worldBounds.minX = Math.min(worldBounds.minX, point.x - 96);
      worldBounds.maxX = Math.max(worldBounds.maxX, point.x + 96);
      worldBounds.minY = Math.min(worldBounds.minY, point.y - 64);
      worldBounds.maxY = Math.max(worldBounds.maxY, point.y + 128);
    });
    this.walkabilityGrid = createWalkabilityMatrix(map.width, map.height, (x, y) => walkableTiles.has(`${x}:${y}`));

    const anchors = readEntityAnchors(map.getObjectLayer('Entities')?.objects);
    const playerAnchor = requireEntityAnchor(anchors, 'player', this.spawnId);
    this.assertWalkable(playerAnchor.tileX, playerAnchor.tileY, `player:${this.spawnId}`);
    this.createPlayer(floor, playerAnchor.tileX, playerAnchor.tileY);
    this.configureCamera(worldBounds);

    this.addZoneLabels(floor, map.getObjectLayer('Zones')?.objects);
    this.addWalkZones(floor, walkable);

    for (const clueId of WORLD_MAPS[this.worldMapId].clueIds) {
      const clue = clueById[clueId];
      if (!clue) throw new Error(`Unknown clue in ${this.worldMapId}: ${clueId}`);
      const anchor = requireEntityAnchor(anchors, 'clue', clueId);
      this.assertWalkable(anchor.tileX, anchor.tileY, `clue:${clueId}`);
      const point = floor.tileToWorldXY(anchor.tileX, anchor.tileY);
      this.addClueHotspot(floor, clueId, clue.title, anchor.tileX, anchor.tileY, point.x, point.y + 36);
    }

    for (const witnessId of WORLD_MAPS[this.worldMapId].witnessIds) {
      const witness = witnessById[witnessId];
      if (!witness) throw new Error(`Unknown witness in ${this.worldMapId}: ${witnessId}`);
      const anchor = requireEntityAnchor(anchors, 'witness', witnessId);
      this.assertWalkable(anchor.tileX, anchor.tileY, `witness:${witnessId}`);
      const point = floor.tileToWorldXY(anchor.tileX, anchor.tileY);
      this.addWitness(floor, witnessId, witness.name, witness.role, anchor.tileX, anchor.tileY, point.x, point.y + 50);
    }

    for (const transition of readMapTransitions(map.getObjectLayer('Transitions')?.objects)) {
      this.assertWalkable(transition.tileX, transition.tileY, `transition:${transition.id}`);
      this.addTransition(floor, transition);
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

  private assertWalkable(tileX: number, tileY: number, label: string) {
    if (this.walkabilityGrid[tileY]?.[tileX] !== 1) throw new Error(`${this.worldMapId} ${label} is not on Walkable`);
  }

  private configureCamera(bounds: WorldBounds) {
    if (!this.player || !Number.isFinite(bounds.minX)) return;
    const paddingX = 260;
    const paddingY = 190;
    this.cameras.main.setBounds(
      bounds.minX - paddingX,
      bounds.minY - paddingY,
      bounds.maxX - bounds.minX + paddingX * 2,
      bounds.maxY - bounds.minY + paddingY * 2,
    );
    this.cameras.main.setZoom(0.92);
    this.cameras.main.setDeadzone(210, 130);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
  }

  private addZoneLabels(floor: FloorLayer, objects: Parameters<typeof readMapZones>[0]) {
    for (const zone of readMapZones(objects)) {
      const point = floor.tileToWorldXY(zone.tileX, zone.tileY);
      this.add.text(point.x, point.y + 28, zone.label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '10px',
        color: '#b9aa8d',
        backgroundColor: '#11110ed9',
        padding: { x: 5, y: 3 },
      }).setOrigin(0.5).setDepth(point.y + 4).setAlpha(0.76);
    }
  }

  private addWalkZones(floor: FloorLayer, walkable: FloorLayer) {
    walkable.forEachTile((tile) => {
      if (tile.index < 0) return;
      const point = floor.tileToWorldXY(tile.x, tile.y);
      const zone = this.add.zone(point.x, point.y + 32, 112, 54).setInteractive({ useHandCursor: true }).setDepth(-1);
      zone.on('pointerdown', () => this.walkToTile(floor, tile.x, tile.y));
    });
  }

  private createPlayer(floor: FloorLayer, tileX: number, tileY: number) {
    const start = floor.tileToWorldXY(tileX, tileY);
    const shadow = this.add.ellipse(0, 0, 38, 14, 0x000000, 0.48);
    const body = this.add.image(0, -49, 'detective').setDisplaySize(52, 91);
    this.playerBody = body;
    this.playerTile = { x: tileX, y: tileY };
    this.player = this.add.container(start.x, start.y + 52, [shadow, body]).setDepth(start.y + 130).setName('detective');
  }

  private walkToTile(floor: FloorLayer, tileX: number, tileY: number, onArrive?: () => void) {
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
    this.followPath(floor, path.slice(1), 0, generation, onArrive);
  }

  private followPath(floor: FloorLayer, path: TilePoint[], index: number, generation: number, onArrive?: () => void) {
    if (!this.player || generation !== this.movementGeneration) return;
    if (index >= path.length) {
      this.playerBody?.setY(-49);
      onArrive?.();
      return;
    }

    const next = path[index];
    const point = floor.tileToWorldXY(next.x, next.y);
    const x = point.x;
    const y = point.y + 52;
    const duration = Phaser.Math.Clamp(Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y) * 2.5, 90, 260);
    if (this.playerBody) {
      this.playerBody.setFlipX(x < this.player.x);
      this.tweens.add({ targets: this.playerBody, y: -53, duration: Math.max(55, duration / 2), yoyo: true });
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
        this.followPath(floor, path, index + 1, generation, onArrive);
      },
    });
  }

  private addClueHotspot(floor: FloorLayer, id: string, title: string, tileX: number, tileY: number, x: number, y: number) {
    const discovered = useInvestigationStore.getState().discoveredClueIds.includes(id);
    const ring = this.add.ellipse(x, y, 58, 23, discovered ? 0x7b837a : 0xc2a76a, discovered ? 0.05 : 0.09)
      .setStrokeStyle(1.5, discovered ? 0x858b84 : 0xd0b775, discovered ? 0.24 : 0.58).setDepth(y - 1);
    const image = this.add.image(x, y - 20, CLUE_TEXTURE_BY_ID[id]).setDisplaySize(46, 46).setDepth(y + 1).setAlpha(discovered ? 0.72 : 0.94);
    const hit = this.add.zone(x, y - 20, 66, 62).setInteractive({ useHandCursor: true }).setDepth(y + 5);
    if (!discovered) this.tweens.add({ targets: ring, alpha: { from: 0.28, to: 0.72 }, duration: 1450, yoyo: true, repeat: -1 });

    hit.on('pointerover', (pointer: Phaser.Input.Pointer) => {
      image.setScale(1.08);
      this.showTooltip(discovered ? `${title} · logged` : title, pointer.worldX, pointer.worldY - 36);
    });
    hit.on('pointerout', () => { image.setScale(1); this.hideTooltip(); });
    hit.on('pointerdown', () => this.walkToTile(floor, tileX, tileY, () => {
      const wasDiscovered = useInvestigationStore.getState().discoveredClueIds.includes(id);
      useInvestigationStore.getState().discoverClue(id);
      if (!wasDiscovered) {
        for (const audio of audioForNewClue(id)) this.playAudio(audio);
        this.tweens.killTweensOf(ring);
        ring.setAlpha(0.28);
        image.setAlpha(0.72);
        this.flashMessage('EVIDENCE LOGGED', '#f0cf88');
      }
    }));
  }

  private addWitness(floor: FloorLayer, id: string, name: string, role: string, tileX: number, tileY: number, x: number, y: number) {
    const shadow = this.add.ellipse(x, y, 40, 14, 0x000000, 0.5).setDepth(y - 2);
    const body = this.add.image(x, y, WITNESS_TEXTURE_BY_ID[id]).setOrigin(0.5, 1).setDisplaySize(56, 100).setDepth(y + 1);
    const label = this.add.text(x, y + 8, name.split(' ')[0], {
      fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#ded6c8', backgroundColor: '#0c0d0bd9', padding: { x: 5, y: 3 },
    }).setOrigin(0.5).setDepth(y + 6);
    const hit = this.add.zone(x, y - 48, 66, 104).setInteractive({ useHandCursor: true }).setDepth(y + 7);
    hit.on('pointerover', (pointer: Phaser.Input.Pointer) => {
      body.setScale(1.05); shadow.setScale(1.08); label.setColor('#f2d899');
      this.showTooltip(`${name} · ${role}`, pointer.worldX, pointer.worldY - 70);
    });
    hit.on('pointerout', () => { body.setScale(1); shadow.setScale(1); label.setColor('#ded6c8'); this.hideTooltip(); });
    hit.on('pointerdown', () => this.walkToTile(floor, tileX, tileY, () => useInvestigationStore.getState().selectWitness(id)));
  }

  private addTransition(floor: FloorLayer, transition: MapTransition) {
    const point = floor.tileToWorldXY(transition.tileX, transition.tileY);
    const marker = this.add.text(point.x, point.y + 17, '⇅', {
      fontFamily: 'Arial, sans-serif', fontSize: '16px', color: '#d2b46f', backgroundColor: '#12120ee0', padding: { x: 6, y: 3 },
    }).setOrigin(0.5).setDepth(point.y + 8);
    const hit = this.add.zone(point.x, point.y + 18, 70, 52).setInteractive({ useHandCursor: true }).setDepth(point.y + 9);
    hit.on('pointerover', (pointer: Phaser.Input.Pointer) => { marker.setColor('#ffe0a0'); this.showTooltip(transition.label, pointer.worldX, pointer.worldY - 36); });
    hit.on('pointerout', () => { marker.setColor('#d2b46f'); this.hideTooltip(); });
    hit.on('pointerdown', () => this.walkToTile(floor, transition.tileX, transition.tileY, () => useWorldStore.getState().navigate(transition.targetMap, transition.targetSpawn)));
  }

  private addHud() {
    const map = WORLD_MAPS[this.worldMapId];
    this.add.text(26, 24, `HOTEL NOCTURNE / ${map.title.toUpperCase()}`, {
      fontFamily: 'Georgia, serif', fontSize: '20px', color: '#d9c18c', backgroundColor: '#0a0b08cc', padding: { x: 8, y: 5 },
    }).setScrollFactor(0).setDepth(30000);
    this.add.text(26, 58, 'ROOSEVELT HOTEL 1925 · TOPOLOGY RECONSTRUCTION', {
      fontFamily: 'Arial, sans-serif', fontSize: '9px', color: '#7f846f', letterSpacing: 1,
    }).setScrollFactor(0).setDepth(30000);
    this.objectiveText = this.add.text(996, 26, '', {
      fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#d0b36f', align: 'right', backgroundColor: '#0a0b08cc', padding: { x: 7, y: 5 },
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(30000);
  }

  private updateObjective(found: number) {
    this.objectiveText?.setText(found >= 7 ? 'ALL EVIDENCE LOGGED · BUILD THE CASE' : `EVIDENCE ${found}/7 · SEARCH EVERY LEVEL`);
  }

  private flashMessage(textValue: string, color: string) {
    const text = this.add.text(this.cameras.main.midPoint.x, this.cameras.main.midPoint.y - 150, textValue, {
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
