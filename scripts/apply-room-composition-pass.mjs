import fs from 'node:fs';

const path = 'src/game/RooseveltScene.ts';
let source = fs.readFileSync(path, 'utf8');

function replaceOnce(search, replacement, label) {
  if (typeof search === 'string') {
    const count = source.split(search).length - 1;
    if (count !== 1) throw new Error(`${label}: expected one match, got ${count}`);
    source = source.replace(search, replacement);
    return;
  }
  const matches = [...source.matchAll(search)];
  if (matches.length !== 1) throw new Error(`${label}: expected one regex match, got ${matches.length}`);
  source = source.replace(search, replacement);
}

replaceOnce(
  '    this.renderFloor(visibleFloorTiles);',
  '    this.renderFloor(visibleFloorTiles, walkableTiles);',
  'render floor call',
);

replaceOnce(
  /  private renderFloor\(tiles: Set<string>\) \{[\s\S]*?\n  \}\n\n  private assertWalkable/,
  `  private renderFloor(tiles: Set<string>, walkableTiles: Set<string>) {\n    const floor = this.add.graphics().setDepth(-20_000).setName('architectural-floor');\n    const isBasement = this.worldMapId === 'roosevelt-basement';\n    const roomFill = isBasement ? 0x4a4a46 : 0x21192b;\n    const corridorFill = isBasement ? 0x5a5852 : 0x34223c;\n    const edge = isBasement ? 0x777269 : 0x806443;\n    const trim = isBasement ? 0x91887a : 0xb68a47;\n    const motif = isBasement ? 0x2f302f : 0x6d4e82;\n\n    const diamondPath = (cx: number, cy: number, halfW: number, halfH: number) => {\n      floor.beginPath();\n      floor.moveTo(cx, cy - halfH);\n      floor.lineTo(cx + halfW, cy);\n      floor.lineTo(cx, cy + halfH);\n      floor.lineTo(cx - halfW, cy);\n      floor.closePath();\n    };\n\n    for (const tileKey of tiles) {\n      const [tileX, tileY] = tileKey.split(':').map(Number);\n      const point = this.tileToWorld(tileX, tileY);\n      const cx = point.x;\n      const cy = point.y + 32;\n      const walkable = walkableTiles.has(tileKey);\n\n      floor.fillStyle(walkable ? corridorFill : roomFill, 1);\n      diamondPath(cx, cy, 64, 32);\n      floor.fillPath();\n\n      floor.lineStyle(walkable ? 1.35 : 0.8, edge, walkable ? 0.52 : 0.26);\n      diamondPath(cx, cy, 63, 31);\n      floor.strokePath();\n\n      if (walkable && !isBasement) {\n        floor.lineStyle(1.5, trim, 0.52);\n        diamondPath(cx, cy, 52, 26);\n        floor.strokePath();\n        if ((tileX + tileY) % 3 === 0) {\n          floor.fillStyle(motif, 0.56);\n          floor.fillCircle(cx, cy, 3.2);\n          floor.lineStyle(1, trim, 0.42);\n          floor.strokeCircle(cx, cy, 6.5);\n        }\n      } else if (isBasement && (tileX * 3 + tileY) % 7 === 0) {\n        floor.fillStyle(0x272826, 0.5);\n        floor.fillRect(cx - 4, cy - 2, 8, 4);\n        floor.lineStyle(1, 0x7b756b, 0.4);\n        floor.strokeRect(cx - 5, cy - 3, 10, 6);\n      }\n\n      // Keep a trace of the generated material without repeating its heavy black seams.\n      if ((tileX + tileY) % 4 === 0) {\n        this.add.image(cx, cy, 'roosevelt-floor')\n          .setDisplaySize(112, 56)\n          .setAlpha(isBasement ? 0.08 : 0.065)\n          .setDepth(-19_999);\n      }\n    }\n  }\n\n  private assertWalkable`,
  'replace repeated floor grid',
);

replaceOnce(
  /  private addTransition\(transition: MapTransition\) \{[\s\S]*?\n  \}\n\n  private addHud\(\) \{/,
  `  private addTransition(transition: MapTransition) {\n    const point = this.tileToWorld(transition.tileX, transition.tileY);\n    const portal = drawIsometricDoor(this, {\n      x: point.x,\n      y: point.y + 32,\n      side: 'ne',\n      height: ROOSEVELT_VISUAL_TARGET.wallHeight,\n      depth: point.y + 104,\n      variant: this.worldMapId,\n      label: 'LIFT',\n    });\n    portal.graphics.setName('integrated-elevator-wall');\n    portal.door.setName('integrated-elevator-gate');\n    const marker = this.add.text(point.x + 30, point.y - 50, '⇅', {\n      fontFamily: 'Georgia, serif', fontSize: '17px', color: '#e8c97f', backgroundColor: '#17120ee8', padding: { x: 6, y: 4 },\n    }).setOrigin(0.5).setDepth(point.y + 132);\n    const hit = this.add.zone(point.x + 26, point.y - 45, 126, 184).setInteractive({ useHandCursor: true }).setDepth(point.y + 134);\n    hit.on('pointerover', (pointer: Phaser.Input.Pointer) => {\n      portal.door.setAlpha(0.78); portal.plaque.setScale(1.08); marker.setColor('#ffe0a0');\n      this.showTooltip(transition.label, pointer.worldX, pointer.worldY - 48);\n    });\n    hit.on('pointerout', () => {\n      portal.door.setAlpha(1); portal.plaque.setScale(1); marker.setColor('#e8c97f'); this.hideTooltip();\n    });\n    hit.on('pointerdown', (pointer: Phaser.Input.Pointer) => {\n      if (pointer.leftButtonDown()) this.walkToTile(transition.tileX, transition.tileY, () => useWorldStore.getState().navigate(transition.targetMap, transition.targetSpawn));\n    });\n  }\n\n  private addHud() {`,
  'integrate elevator into wall plane',
);

fs.writeFileSync(path, source);
console.log('Applied room composition, coherent floor materials and integrated isometric elevators.');
