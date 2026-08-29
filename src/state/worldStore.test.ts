import { describe, expect, it } from 'vitest';
import { resolvePersistedWorldLocation } from './worldStore';

describe('world location migration', () => {
  it('migrates the retired prototype map to the Roosevelt lobby', () => {
    expect(resolvePersistedWorldLocation({
      currentMapId: 'prototype-room-307',
      spawnId: 'detective',
    })).toEqual({ currentMapId: 'roosevelt-lobby', spawnId: 'detective' });
  });

  it('preserves a valid Roosevelt floor and spawn', () => {
    expect(resolvePersistedWorldLocation({
      currentMapId: 'roosevelt-floor-3',
      spawnId: 'elevator-from-lobby',
    })).toEqual({ currentMapId: 'roosevelt-floor-3', spawnId: 'elevator-from-lobby' });
  });

  it('fails closed to the default world for unknown persisted values', () => {
    expect(resolvePersistedWorldLocation({ currentMapId: 'unknown-map', spawnId: 123 })).toEqual({
      currentMapId: 'roosevelt-lobby',
      spawnId: 'detective',
    });
  });
});
