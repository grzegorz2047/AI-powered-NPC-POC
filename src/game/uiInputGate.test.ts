import { describe, expect, it } from 'vitest';
import { isGameInputBlocked, setGameInputBlocker } from './uiInputGate';

describe('game UI input gate', () => {
  it('keeps Phaser blocked until every overlay releases its reason', () => {
    expect(isGameInputBlocked()).toBe(false);

    expect(setGameInputBlocker('scene-list', true)).toBe(true);
    expect(setGameInputBlocker('interview', true)).toBe(true);
    expect(setGameInputBlocker('scene-list', false)).toBe(true);
    expect(isGameInputBlocked()).toBe(true);
    expect(setGameInputBlocker('interview', false)).toBe(false);
    expect(isGameInputBlocked()).toBe(false);
  });
});
