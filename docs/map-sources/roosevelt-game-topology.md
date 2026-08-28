# Roosevelt Hotel → Hotel Nocturne gameplay topology

This document prevents the real-building requirement from degrading into a loosely themed map.

The source plans are listed in `roosevelt-hotel-1925.md`. The game uses original geometry/art reconstructed from those plans; plan scans are references only.

## Principle

Preserve **circulation topology and functional adjacency**, not every room of a 1,000+ room hotel.

A playable scene may omit repeated guest rooms or merge equivalent support areas, but it must not invent a shortcut through a wall, move the elevator core to the opposite wing, or turn unrelated spaces into adjacent rooms merely to simplify scripting.

## Scene A — `roosevelt-lobby`

### Real source
Primary reference: Roosevelt first story (main public rooms) plus the immediately connected ground-story arrival/service circulation.

### Real relationships to preserve
- main lobby is reached from the arrival/arcade circulation;
- lounge/public rooms connect off the lobby;
- service circulation is distinct from the main guest route;
- service/freight elevator access belongs to back-of-house circulation;
- dining/pantry/service spaces sit on the service side rather than inside the guest corridor.

### Game use
- **Nina**: reception/front-desk side of lobby;
- **Kamil**: lounge/bar interpretation of a public hospitality room;
- **Marek** can cross between public and management/service access;
- elevator/stair transition to `roosevelt-floor-3`;
- staff/service transition to `roosevelt-basement` is not presented as a public guest door.

### Compression
The game scene may visually join the ground-story arrival sequence and first-story lobby by one short stair/landing transition instead of loading two maps. This is a declared gameplay compression, not a claim that both functions occupied one historical floor.

## Scene B — `roosevelt-floor-3`

### Real source
Roosevelt third floor plan (1925), supported by the typical guest-floor plan for repeated room/corridor logic.

### Real relationships to preserve
- guest rooms begin on this story;
- room numbering is in the 300 range and **Room 307 exists on the real plan**;
- elevators open to a central elevator lobby;
- guest corridors branch from the elevator lobby;
- a separate service hall/core connects staff circulation;
- rooms line the corridor and face street/light-court edges;
- the third floor contains a health-clinic group, which can remain background/closed space rather than being repurposed as a fictional room.

### Game use
Primary murder scene:
- Room 307;
- M-01/keycard evidence;
- broken whisky glass;
- green fiber at/near the room;
- CCTV still + service-note context;
- **Irena** path through staff/service circulation;
- **Marek** route from 307 toward service hall/elevator.

### CCTV rule
The camera location may be fictional, because the 1925 plan predates CCTV, but it must cover a real corridor/service junction. Camera placement cannot create a corridor that does not exist in the source topology.

## Scene C — `roosevelt-basement`

### Real source
First-basement service plan for staff circulation and storage/support layout; lower-basement documentation for laundry/plant functions.

### Real relationships to preserve
- staff/service corridors are separated from guest public circulation;
- storage/support rooms line the service corridor;
- staff facilities and service-elevator connections are part of the back-of-house network;
- historical guest laundry existed in the lower basement system.

### Game use
- housekeeping/laundry staging;
- burnt ledger fragment;
- hidden brass heron;
- disposal/cleanup route from service elevator;
- environmental evidence that Wolski used back-of-house circulation.

### Compression
The game combines selected first-basement service topology with the lower-basement laundry function into one playable `roosevelt-basement` scene. The floor-plan source remains explicit so this is not presented as a literal one-floor historical reconstruction.

## Vertical navigation contract

Tiled `Transitions` objects will connect scenes by named spawn points:

- lobby guest elevator ↔ floor-3 elevator lobby;
- lobby/service access ↔ basement service elevator;
- floor-3 service elevator ↔ basement service side where story progression permits it.

A transition contains only:
- `transitionId`;
- `label`;
- `tileX`, `tileY`;
- `targetMap`;
- `targetSpawn`.

The domain case never stores map coordinates.

## Gameplay placement constraints

1. Every clue/NPC anchor must sit on a `Walkable` tile.
2. EasyStar pathfinding must find a route from the scene spawn to every required interaction.
3. Room 307 must be reachable from the guest corridor, not the service corridor directly.
4. Wolski's service escape route must connect from the Room 307 corridor to a real service-core route.
5. The basement evidence chain must be reachable via staff/service circulation.
6. Nina and Kamil remain in public-facing spaces; Irena's strongest sighting occurs where public and service circulation come close enough to make it plausible.
7. No final accusation fact may depend on recognizing the real Roosevelt Hotel; the map is evidence context, not trivia.
