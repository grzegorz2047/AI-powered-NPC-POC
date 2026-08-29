# Real-world map source: Roosevelt Hotel, New York (1925)

Working source selected for issue #14.

## Building

**Roosevelt Hotel**, 45 East 45th Street between Madison Avenue and Vanderbilt Avenue, New York City. Opened 1924. Original architect: George B. Post & Son.

The game keeps the fictional name **Hotel Nocturne** and fictional story, but the explorable topology will be reconstructed from the real Roosevelt Hotel plan set published in 1925.

## Why this hotel

The real **third floor plan already contains rooms numbered 300-379, including room 307**, plus a service hall, elevator lobby, corridors, pantry, linen/store/support rooms and other back-of-house circulation. That lets the case keep `Room 307` without inventing room numbering.

The same published plan set also contains a first-floor plan with lobby/dining/service spaces and basement plans with staff/service corridors.

## Source drawings

Published in *Hotel Monthly*, Volume 33, Number 382, January 1925, article “Introducing the Roosevelt of New York City”, pages 26-58 (print version). Wikimedia Commons identifies these files as public domain in the United States due to the 1925 publication date.

- First floor: https://commons.wikimedia.org/wiki/File:Roosevelt_Hotel_first_floor_plan.png
- Third floor: https://commons.wikimedia.org/wiki/File:Roosevelt_Hotel_third_floor_plan.png
- Typical floor: https://commons.wikimedia.org/wiki/File:Roosevelt_Hotel_typical_floor_plan.png
- First basement: https://commons.wikimedia.org/wiki/File:Roosevelt_Hotel_first_basement_floor_plan.png
- Third basement: https://commons.wikimedia.org/wiki/File:Roosevelt_Hotel_third_basement_floor_plan.png

Do not ship the source scans as game textures. Use them as architectural/topological references and build original Tiled geometry and original game art.

## Mapping to the case

### First floor / public area
Use the original first-floor circulation as the basis for:
- reception / Nina;
- bar or lounge position / Kamil;
- lobby and public circulation;
- elevator/stair transition to guest floors;
- management/admin access points.

### Third floor / Room 307
Use the real third-floor topology as the principal murder-scene map:
- real room-number range includes **307**;
- guest corridors remain faithful to the plan topology;
- the real service hall/elevator/service core becomes the route relevant to Wolski and CCTV;
- Irena's movement and the green-fiber/keycard evidence stay on this level;
- CCTV placement can be fictional but must respect real corridor/service topology.

### Basement / service area
Use basement topology for:
- laundry / housekeeping staging;
- staff/service corridors;
- burnt ledger fragment;
- hidden brass heron;
- route used to move evidence away from room 307.

## Implementation rules

- `caseData.ts` contains no coordinates.
- Player/NPC/clue spawn points live in Tiled object layers.
- Walkable areas, stair/elevator transitions and room/zone metadata should also move into Tiled data before final geometry lands.
- Source plan scans are references only; final floors, walls, furniture, characters and UI are original assets.
- Art direction: original worn-retro / neo-noir isometric visuals influenced by the readability and pre-rendered feel of classic late-1990s isometric RPGs, without copying Fallout assets, characters or interface elements.

## Planned scene split

1. `roosevelt-lobby` — public first-floor investigation area.
2. `roosevelt-floor-3` — room 307, corridors and service core; primary murder scene.
3. `roosevelt-basement` — laundry/service evidence area.

State remains global, so moving between maps must not reset discovered clues, interviews or accusation progress.
