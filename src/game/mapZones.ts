export type MapZone = {
  id: string;
  label: string;
  tileX: number;
  tileY: number;
  sourceLabel?: string;
};

type TiledPropertyLike = { name?: string; value?: unknown };
type TiledZoneObject = { type?: string; properties?: TiledPropertyLike[] };

function propertyValue(object: TiledZoneObject, name: string) {
  return object.properties?.find((property) => property.name === name)?.value;
}

export function readMapZones(objects: readonly TiledZoneObject[] | undefined): MapZone[] {
  const zones: MapZone[] = [];
  const ids = new Set<string>();

  for (const object of objects ?? []) {
    if (object.type !== 'zone') continue;
    const id = propertyValue(object, 'zoneId');
    const label = propertyValue(object, 'label');
    const tileX = propertyValue(object, 'tileX');
    const tileY = propertyValue(object, 'tileY');
    const sourceLabel = propertyValue(object, 'sourceLabel');
    if (typeof id !== 'string' || typeof label !== 'string' || typeof tileX !== 'number' || typeof tileY !== 'number') continue;
    if (ids.has(id)) throw new Error(`Tiled map contains duplicate zone: ${id}`);
    ids.add(id);
    zones.push({ id, label, tileX, tileY, sourceLabel: typeof sourceLabel === 'string' ? sourceLabel : undefined });
  }

  return zones;
}
