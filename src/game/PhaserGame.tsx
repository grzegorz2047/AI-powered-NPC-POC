import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { useWorldStore } from '../state/worldStore';
import { GameScene } from './GameScene';
import { RooseveltScene } from './RooseveltScene';
import { subscribeGameInputBlocked } from './uiInputGate';
import { WORLD_MAPS } from './worldManifest';

export function PhaserGame() {
  const hostRef = useRef<HTMLDivElement>(null);
  const currentMapId = useWorldStore((state) => state.currentMapId);
  const spawnId = useWorldStore((state) => state.spawnId);

  useEffect(() => {
    if (!hostRef.current) return;

    const scene = currentMapId === 'prototype-room-307'
      ? new GameScene(currentMapId, spawnId)
      : new RooseveltScene(currentMapId, spawnId);

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: hostRef.current,
      width: 1024,
      height: 640,
      backgroundColor: '#070b12',
      scene: [scene],
      render: {
        antialias: true,
        pixelArt: false,
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1024,
        height: 640,
      },
    });

    const unsubscribeInputGate = subscribeGameInputBlocked((blocked) => {
      if (game.input) game.input.enabled = !blocked;
    });

    return () => {
      unsubscribeInputGate();
      game.destroy(true);
    };
  }, [currentMapId, spawnId]);

  return (
    <div
      ref={hostRef}
      className="game-host"
      aria-label={`Hotel Nocturne investigation scene: ${WORLD_MAPS[currentMapId].title}`}
    />
  );
}
