export type MapEntityKind = 'clue' | 'witness' | 'player';

export type MapEntityAnchor = {
  entityId: string;
  kind: MapEntityKind;
  tileX: number;
  tileY: number;
};

type TiledPropertyLike = {
  name?: string;
  value?: unknown;
};

type TiledObjectLike = {
  type?: string;
  properties?: TiledPropertyLike[];
};

function propertyValue(object: TiledObjectLike, name: string) {
  return object.properties?.find((property) => property.name === name)?.value;
}

export function readEntityAnchors(objects: readonly TiledObjectLike[] | undefined): Map<string, MapEntityAnchor> {
  const anchors = new Map<string, MapEntityAnchor>();

  for (const object of objects ?? []) {
    if (object.type !== 'clue' && object.type !== 'witness' && object.type !== 'player') continue;

    const entityId = propertyValue(object, 'entityId');
    const tileX = propertyValue(object, 'tileX');
    const tileY = propertyValue(object, 'tileY');
    if (typeof entityId !== 'string' || typeof tileX !== 'number' || typeof tileY !== 'number') continue;

    const anchor: MapEntityAnchor = { entityId, kind: object.type, tileX, tileY };
    anchors.set(`${anchor.kind}:${anchor.entityId}`, anchor);
  }

  return anchors;
}

export function mapAnchorKey(kind: MapEntityKind, entityId: string) {
  return `${kind}:${entityId}`;
}
