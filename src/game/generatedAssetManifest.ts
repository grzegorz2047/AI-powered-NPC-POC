import cctvDesk from './generatedTextures/cctvDesk';
import detective from './generatedTextures/characterDetective';
import irena from './generatedTextures/characterIrena';
import { character_kamil as kamil, character_marek as marek, character_nina as nina } from './generatedTextures/charactersRemaining';
import cleaningCart from './generatedTextures/cleaningCart';
import { floor_guest as floorGuest, floor_lobby as floorLobby, floor_service as floorService } from './generatedTextures/floors';
import { laundry } from './generatedTextures/laundry';
import luggageCart from './generatedTextures/luggageCart';
import { reception } from './generatedTextures/reception';
import { elevator, stairs } from './generatedTextures/verticalModules';
import { wall_door307 as room307, wall_ne as wallNe, wall_nw as wallNw } from './generatedTextures/walls';

/**
 * Canonical generated production art. These values are embedded AVIF sprite payloads,
 * not placeholder paths and not screenshot/mockup plates.
 */
export const GENERATED_ROOSEVELT_ASSETS = {
  detective,
  kamil,
  nina,
  irena,
  marek,
  room307,
  elevator,
  reception,
  stairs,
  laundry,
  cctvDesk,
  cleaningCart,
  luggageCart,
  wallNw,
  wallNe,
  floorLobby,
  floorGuest,
  floorService,
} as const;
