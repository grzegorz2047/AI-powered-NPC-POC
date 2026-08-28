import Phaser from 'phaser';
import { clues, witnesses } from '../data/caseData';
import { useInvestigationStore } from '../state/investigationStore';
import { CLUE_TEXTURE_BY_ID, SCENE_SVG_ASSETS, WITNESS_TEXTURE_BY_ID } from './sceneAssets';

const FLOOR_OFFSET_X = 510;
const FLOOR_OFFSET_Y = 95;
const INTERACTION_DISTANCE = 82;
const WALK_BOUNDS = new Phaser.Geom.Rectangle(225, 150, 585, 350);

export class GameScene extends Phaser.Scene {
  private tooltip?: Phaser.GameObjects.Container;
  private player?: Phaser.GameObjects.Container;
  private playerBody?: Phaser.GameObjects.Image;
  private objectiveText?: Phaser.GameObjects.Text;
  private unsubscribeStore?: () => void;

  constructor() {
    super('investigation');
  }

  preload() {
    this.load.tilemapTiledJSON('hotel-map', '/maps/hotel-nocturne.json');
    this.load.svg('nocturne-floor', '/assets/nocturne-floor.svg', { width: 128, height: 64 });
    for (const [key, url] of SCENE_SVG_ASSETS) this.load.svg(key, url);
  }

  create() {
    this.cameras.main.setBackgroundColor('#05080d');

    const map = this.make.tilemap({ key: 'hotel-map' });
    const tileset = map.addTilesetImage('nocturne-floor', 'nocturne-floor');
    const floor = map.createLayer('Floor', tileset!, FLOOR_OFFSET_X, FLOOR_OFFSET_Y);
    floor?.setAlpha(0.98).setDepth(-2);

    this.addHotelShell();
    this.addEnvironmentProps();
    this.addRoomLabels();
    this.addWalkZone();
    this.createPlayer(floor);

    for (const clue of clues) {
      const point = floor?.tileToWorldXY(clue.tileX, clue.tileY);
      if (!point) continue;
      this.addClueHotspot(clue.id, clue.title, point.x, point.y + 36);
    }

    for (const witness of witnesses) {
      const point = floor?.tileToWorldXY(witness.tileX, witness.tileY);
      if (!point) continue;
      this.addWitness(witness.id, witness.name, witness.role, point.x, point.y + 50);
    }

    this.addHud();
    this.updateObjective(useInvestigationStore.getState().discoveredClueIds.length);
    this.unsubscribeStore = useInvestigationStore.subscribe((state, previous) => {
      if (state.discoveredClueIds.length !== previous.discoveredClueIds.length) {
        this.updateObjective(state.discoveredClueIds.length);
      }
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unsubscribeStore?.());
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

  private addWalkZone() {
    const zone = this.add.rectangle(WALK_BOUNDS.centerX, WALK_BOUNDS.centerY, WALK_BOUNDS.width, WALK_BOUNDS.height, 0x000000, 0.001)
      .setInteractive({ useHandCursor: true })
      .setDepth(-1);
    zone.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.walkTo(pointer.worldX, pointer.worldY));
  }

  private createPlayer(floor: Phaser.Tilemaps.TilemapLayer | null) {
    const start = floor?.tileToWorldXY(2, 6) ?? new Phaser.Math.Vector2(340, 440);
    const shadow = this.add.ellipse(0, 0, 36, 13, 0x000000, 0.34);
    const body = this.add.image(0, -48, 'detective').setDisplaySize(50, 88);
    this.playerBody = body;
    this.player = this.add.container(start.x, start.y + 52, [shadow, body]).setDepth(start.y + 130);
  }

  private walkTo(rawX: number, rawY: number, onArrive?: () => void) {
    if (!this.player) return;
    const x = Phaser.Math.Clamp(rawX, WALK_BOUNDS.left + 12, WALK_BOUNDS.right - 12);
    const y = Phaser.Math.Clamp(rawY, WALK_BOUNDS.top + 12, WALK_BOUNDS.bottom - 12);
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y);
    if (distance < 5) {
      onArrive?.();
      return;
    }

    this.tweens.killTweensOf(this.player);
    if (this.playerBody) {
      this.tweens.killTweensOf(this.playerBody);
      this.playerBody.setFlipX(x < this.player.x);
    }

    const marker = this.add.ellipse(x, y + 2, 24, 10, 0xd1ae68, 0.16).setStrokeStyle(1, 0xd1ae68, 0.42).setDepth(y - 2);
    this.tweens.add({ targets: marker, alpha: 0, scaleX: 1.7, scaleY: 1.7, duration: 520, onComplete: () => marker.destroy() });

    const duration = Phaser.Math.Clamp(distance * 3.1, 170, 980);
    if (this.playerBody) {
      this.tweens.add({
        targets: this.playerBody,
        y: -52,
        duration: 130,
        yoyo: true,
        repeat: Math.max(0, Math.floor(duration / 260) - 1),
        onComplete: () => this.playerBody?.setY(-48),
      });
    }
    this.tweens.add({
      targets: this.player,
      x,
      y,
      duration,
      ease: 'Sine.easeInOut',
      onUpdate: () => this.player?.setDepth((this.player?.y ?? y) + 130),
      onComplete: () => onArrive?.(),
    });
  }

  private approachAndInteract(targetX: number, targetY: number, action: () => void) {
    if (!this.player) {
      action();
      return;
    }
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, targetX, targetY);
    if (distance <= INTERACTION_DISTANCE) {
      action();
      return;
    }
    const angle = Phaser.Math.Angle.Between(targetX, targetY, this.player.x, this.player.y);
    this.walkTo(
      targetX + Math.cos(angle) * (INTERACTION_DISTANCE - 12),
      targetY + Math.sin(angle) * (INTERACTION_DISTANCE - 12),
      action,
    );
  }

  private addClueHotspot(id: string, title: string, x: number, y: number) {
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
      this.approachAndInteract(x, y, () => {
        const wasDiscovered = useInvestigationStore.getState().discoveredClueIds.includes(id);
        useInvestigationStore.getState().discoverClue(id);
        if (!wasDiscovered) {
          this.tweens.killTweensOf(ring);
          ring.setAlpha(0.3).setScale(1);
          image.setAlpha(0.76);
          this.flashEvidenceAdded(x, y - 48);
        }
      });
    });
  }

  private addWitness(id: string, name: string, role: string, x: number, y: number) {
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
      this.approachAndInteract(x, y, () => useInvestigationStore.getState().selectWitness(id));
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
    this.add.text(30, 26, 'HOTEL NOCTURNE / ROOM 307', {
      fontFamily: 'Georgia, serif',
      fontSize: '22px',
      color: '#e4c784',
      letterSpacing: 2,
    }).setScrollFactor(0).setDepth(20000);
    this.add.text(30, 57, 'Click the floor to move. Click a clue or witness to walk over and inspect.', {
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
