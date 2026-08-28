import Phaser from 'phaser';
import { clues, witnesses } from '../data/caseData';
import { useInvestigationStore } from '../state/investigationStore';

const FLOOR_OFFSET_X = 510;
const FLOOR_OFFSET_Y = 95;

export class GameScene extends Phaser.Scene {
  private tooltip?: Phaser.GameObjects.Container;

  constructor() {
    super('investigation');
  }

  preload() {
    this.load.tilemapTiledJSON('hotel-map', '/maps/hotel-nocturne.json');
    this.load.svg('nocturne-floor', '/assets/nocturne-floor.svg', { width: 128, height: 64 });
  }

  create() {
    this.cameras.main.setBackgroundColor('#070b12');

    const map = this.make.tilemap({ key: 'hotel-map' });
    const tileset = map.addTilesetImage('nocturne-floor', 'nocturne-floor');
    const floor = map.createLayer('Floor', tileset!, FLOOR_OFFSET_X, FLOOR_OFFSET_Y);
    floor?.setAlpha(0.9);

    this.addHotelBoundaries();
    this.addRoomLabels();

    for (const clue of clues) {
      const point = floor?.tileToWorldXY(clue.tileX, clue.tileY);
      if (!point) continue;
      this.addClueHotspot(clue.id, clue.title, point.x, point.y + 22);
    }

    for (const witness of witnesses) {
      const point = floor?.tileToWorldXY(witness.tileX, witness.tileY);
      if (!point) continue;
      this.addWitness(witness.id, witness.name, witness.role, point.x, point.y + 4);
    }

    this.add.text(32, 28, 'HOTEL NOCTURNE / ROOM 307', {
      fontFamily: 'Georgia, serif',
      fontSize: '22px',
      color: '#e4c784',
      letterSpacing: 2,
    }).setScrollFactor(0);

    this.add.text(32, 58, 'Move the pointer over objects. Click a clue or witness to investigate.', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#8c96a8',
    }).setScrollFactor(0);
  }

  private addHotelBoundaries() {
    const g = this.add.graphics();
    g.lineStyle(3, 0x3a3026, 0.9);
    g.fillStyle(0x141a22, 0.72);
    g.fillRoundedRect(210, 125, 610, 390, 8);
    g.strokeRoundedRect(210, 125, 610, 390, 8);
    g.lineStyle(2, 0x76613b, 0.55);
    g.lineBetween(390, 125, 390, 515);
    g.lineBetween(630, 125, 630, 515);
    g.lineBetween(210, 340, 820, 340);
    g.setDepth(-5);
  }

  private addRoomLabels() {
    const labels = [
      ['RECEPTION', 270, 445],
      ['ROOM 307', 470, 185],
      ['SERVICE', 690, 440],
      ['CCTV', 700, 185],
    ] as const;
    labels.forEach(([label, x, y]) => {
      this.add.text(x, y, label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        color: '#56606e',
      }).setOrigin(0.5).setDepth(-1);
    });
  }

  private addClueHotspot(id: string, title: string, x: number, y: number) {
    const discovered = useInvestigationStore.getState().discoveredClueIds.includes(id);
    const ring = this.add.ellipse(x, y, 54, 24, discovered ? 0x6c6554 : 0xc6a45a, discovered ? 0.12 : 0.16)
      .setStrokeStyle(2, discovered ? 0x8b836f : 0xd4b86c, discovered ? 0.25 : 0.72)
      .setInteractive({ useHandCursor: true })
      .setDepth(y);

    this.tweens.add({
      targets: ring,
      alpha: { from: discovered ? 0.45 : 0.7, to: discovered ? 0.65 : 1 },
      duration: 1100,
      yoyo: true,
      repeat: -1,
    });

    ring.on('pointerover', (pointer: Phaser.Input.Pointer) => {
      ring.setScale(1.15);
      this.showTooltip(title, pointer.worldX, pointer.worldY - 28);
    });
    ring.on('pointerout', () => {
      ring.setScale(1);
      this.hideTooltip();
    });
    ring.on('pointerdown', () => {
      useInvestigationStore.getState().discoverClue(id);
      ring.setStrokeStyle(2, 0x8b836f, 0.32).setFillStyle(0x6c6554, 0.12);
    });
  }

  private addWitness(id: string, name: string, role: string, x: number, y: number) {
    const body = this.add.rectangle(x, y - 28, 28, 48, 0x222d3b, 1)
      .setStrokeStyle(2, 0xb89a5e, 0.55)
      .setInteractive({ useHandCursor: true })
      .setDepth(y + 50);
    const head = this.add.circle(x, y - 62, 12, 0xc5a983, 1).setDepth(y + 51);
    const label = this.add.text(x, y + 4, name.split(' ')[0], {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#d7dce5',
      backgroundColor: '#0a0e15cc',
      padding: { x: 5, y: 3 },
    }).setOrigin(0.5).setDepth(y + 52);

    body.on('pointerover', (pointer: Phaser.Input.Pointer) => {
      body.setStrokeStyle(2, 0xe5c779, 0.95);
      head.setScale(1.06);
      label.setColor('#fff1c7');
      this.showTooltip(`${name} - ${role}`, pointer.worldX, pointer.worldY - 70);
    });
    body.on('pointerout', () => {
      body.setStrokeStyle(2, 0xb89a5e, 0.55);
      head.setScale(1);
      label.setColor('#d7dce5');
      this.hideTooltip();
    });
    body.on('pointerdown', () => useInvestigationStore.getState().selectWitness(id));
  }

  private showTooltip(text: string, x: number, y: number) {
    this.hideTooltip();
    const label = this.add.text(0, 0, text, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#f5ead0',
      backgroundColor: '#090c12ee',
      padding: { x: 9, y: 6 },
    }).setOrigin(0.5);
    this.tooltip = this.add.container(x, y, [label]).setDepth(10000);
  }

  private hideTooltip() {
    this.tooltip?.destroy(true);
    this.tooltip = undefined;
  }
}
