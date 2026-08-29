import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { useWorldStore } from '../state/worldStore';
import { GameScene } from './GameScene';
import { applyMockupMapComposition } from './mockupMapComposition';
import { applyMockupVisualPass } from './mockupVisualPass';
import { prefersReducedMotion } from './motionPreferences';
import { RooseveltScene } from './RooseveltScene';
import { subscribeGameInputBlocked } from './uiInputGate';
import { WORLD_MAPS } from './worldManifest';

export function PhaserGame() {
  const hostRef = useRef<HTMLDivElement>(null);
  const currentMapId = useWorldStore((state) => state.currentMapId);
  const spawnId = useWorldStore((state) => state.spawnId);

  useEffect(() => {
    if (!hostRef.current) return;
    const reduceMotion = prefersReducedMotion();

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

    // Phaser 4.2's isometric culler can address outside LayerData after camera pan / map swaps.
    // Roosevelt maps are small, so rendering the full floor layer is both safe and cheap.
    const enforceSafeIsometricRendering = () => {
      if (currentMapId === 'prototype-room-307') return;
      const activeScene = game.scene.getScene('roosevelt-investigation');
      if (!activeScene) return;

      if (applyMockupVisualPass(activeScene, currentMapId)) {
        applyMockupMapComposition(activeScene, currentMapId);
        hostRef.current?.setAttribute('data-mockup-visual-pass', 'applied');
      }

      for (const child of activeScene.children.list) {
        if (child instanceof Phaser.Tilemaps.TilemapLayer) child.skipCull = true;
      }

      if (reduceMotion) {
        for (const tween of activeScene.tweens.getTweens()) {
          const tweenData = tween as Phaser.Tweens.Tween & { data?: Array<{ repeat?: number }>; totalDuration?: number };
          const repeatsForever = tweenData.data?.some((entry) => entry.repeat === -1) || tweenData.totalDuration === Infinity;
          if (repeatsForever) tween.stop();
        }
      }
    };
    game.events.on(Phaser.Core.Events.POST_STEP, enforceSafeIsometricRendering);

    const unsubscribeInputGate = subscribeGameInputBlocked((blocked) => {
      if (game.input) game.input.enabled = !blocked;
    });

    return () => {
      unsubscribeInputGate();
      game.events.off(Phaser.Core.Events.POST_STEP, enforceSafeIsometricRendering);
      game.destroy(true);
    };
  }, [currentMapId, spawnId]);

  return (
    <div
      ref={hostRef}
      className="game-host"
      data-reduced-motion={prefersReducedMotion() ? 'true' : 'false'}
      aria-label={`Hotel Nocturne investigation scene: ${WORLD_MAPS[currentMapId].title}`}
    />
  );
}
