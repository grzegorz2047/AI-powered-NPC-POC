# Real-world map source: Hotel Oneida (1927)

Working source selected for issue #14.

## Building

**Hotel Oneida**, 181 Main Street at Lenox Avenue, Oneida, New York, USA. Opened in 1927. Original architects: H. L. Stevens & Co.

The game will keep the fictional name **Hotel Nocturne** and fictional case content, but the explorable topology will be derived from the real Hotel Oneida plan set.

## Source drawings

All four drawings were published in *Hotel Monthly*, Volume 35, Number 413, August 1927, pages 44-51 (paper), pages 390-397 (digital). Wikimedia Commons identifies the files as public domain in the United States due to the 1927 publication date.

- First floor: https://commons.wikimedia.org/wiki/File:Hotel_Oneida_first_floor_plan.png
- Second floor: https://commons.wikimedia.org/wiki/File:Hotel_Oneida_second_floor_plan.png
- Typical guest floor: https://commons.wikimedia.org/wiki/File:Hotel_Oneida_typical_floor_plan.png
- Basement: https://commons.wikimedia.org/wiki/File:Hotel_Oneida_basement_floor_plan.png

Do not ship the source scans as game textures. Use them as measured/topological references and create original Tiled geometry and original art assets.

## Mapping to the case

### First floor / public area
Use the real first-floor topology as the basis for:
- reception / Nina;
- bar / Kamil;
- public lobby circulation;
- stairs/elevator transition to guest floors.

### Typical guest floor
Use the real typical-floor corridor/room topology as the basis for:
- fictional room **307**;
- service corridor / CCTV route;
- Irena's movement near the room;
- keycard and green-fiber investigation space.

Room numbering may remain fictional while room/corridor geometry follows the real plan.

### Basement / service area
Use the real basement topology as the basis for:
- laundry / housekeeping;
- service circulation;
- burnt ledger fragment;
- hidden brass heron;
- back-of-house route used by Wolski.

## Implementation rules

- `caseData.ts` must never contain coordinates.
- Spawn points and clue/NPC anchors live in Tiled object layers.
- Walkable areas and transitions should move into Tiled data before the real geometry lands.
- Source plan scans are references only; final textures, props and UI are original.
- Art direction: original neo-noir / worn-retro isometric visuals influenced by the readability and pre-rendered feel of classic late-1990s isometric RPGs, without copying Fallout assets or interface elements.
