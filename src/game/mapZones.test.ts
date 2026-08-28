import { describe, expect, it } from 'vitest';
import { readMapZones } from './mapZones';

describe('Tiled map zones', () => {
  it('reads source-backed room and circulation labels', () => {
    expect(readMapZones([
      { type: 'zone', properties: [
        { name: 'zoneId', value: 'room-307' },
        { name: 'label', value: 'ROOM 307' },
        { name: 'tileX', value: 16 },
        { name: 'tileY', value: 15 },
        { name: 'sourceLabel', value: 'Room 307' },
      ] },
    ])).toEqual([{
      id: 'room-307', label: 'ROOM 307', tileX: 16, tileY: 15, sourceLabel: 'Room 307',
    }]);
  });

  it('rejects duplicate zone ids', () => {
    const zone = { type: 'zone', properties: [
      { name: 'zoneId', value: 'service-hall' },
      { name: 'label', value: 'SERVICE HALL' },
      { name: 'tileX', value: 8 },
      { name: 'tileY', value: 9 },
    ] };
    expect(() => readMapZones([zone, zone])).toThrow(/duplicate zone: service-hall/i);
  });
});
