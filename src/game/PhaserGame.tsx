import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { GameScene } from './GameScene';
import { subscribeGameInputBlocked } from './uiInputGate';

export function PhaserGame() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hostRef.current) return;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: hostRef.current,
      width: 1024,
      height: 640,
      backgroundColor: '#070b12',
      scene: [GameScene],
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
  }, []);

  return <div ref={hostRef} className="game-host" aria-label="Hotel Nocturne investigation scene" />;
}
