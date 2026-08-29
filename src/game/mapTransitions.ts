import { isWorldMapId, type WorldMapId } from './worldManifest';

export type MapTransition = {
  id: string;
  label: string;
  tileX: number;
  tileY: number;
  targetMap: WorldMapId;
  targetSpawn: string;
};

type TiledPropertyLike = { name?: string; value?: unknown };
type TiledTransitionObject = {
  name?: string;
  type?: string;
  properties?: TiledPropertyLike[];
};

function propertyValue(object: TiledTransitionObject, name: string) {
  return object.properties?.find((property) => property.name === name)?.value;
}

export function readMapTransitions(objects: readonly TiledTransitionObject[] | undefined): MapTransition[] {
  const transitions: MapTransition[] = [];

  for (const object of objects ?? []) {
    if (object.type !== 'transition') continue;

    const id = propertyValue(object, 'transitionId');
    const label = propertyValue(object, 'label');
    const tileX = propertyValue(object, 'tileX');
    const tileY = propertyValue(object, 'tileY');
    const targetMap = propertyValue(object, 'targetMap');
    const targetSpawn = propertyValue(object, 'targetSpawn');

    if (
      typeof id !== 'string'
      || typeof label !== 'string'
      || typeof tileX !== 'number'
      || typeof tileY !== 'number'
      || !isWorldMapId(targetMap)
      || typeof targetSpawn !== 'string'
    ) continue;

    transitions.push({ id, label, tileX, tileY, targetMap, targetSpawn });
  }

  return transitions;
}
