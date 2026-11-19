# Isometric line illustrations

Use this file when a screen needs a drawing: a hero, a feature card's picture area, an empty state's picture, a section's lead visual. It covers one style only, the isometric line scheme, and the three files the project copies for it. The style is fixed, so the work is choosing the shapes that carry the point.

## Illustration or icon

An illustration goes where a block has a place for a picture. An icon goes where a small sign accompanies text: a button, a list item, a menu entry, a heading marker. Icons come from the icon set the project uses with the kit; illustrations come from this file.

The split is firm. Never put a 24 px icon into a picture slot, where it reads as a speck of ink in a hole. Never put an illustration where an icon belongs, where it crowds the text and takes the room of the control. Do not mix the two in one slot, and do not draw an icon in the illustration style or build an illustration out of icon pieces.

## Style

One style only: isometric line schemes, one stroke on a 400 x 320 field, a card face and muted sides, one highlighted element.

No people, no faces, no logos, no free subjects (animals, landscapes, objects drawn freehand), no gradients, no text inside the drawing, no raster images. If a drawing needs any of these to make its point, the point does not belong in this style.

## Files and steps

1. Copy `templates/iso.ts` and `templates/iso.module.css` next to the screen's components. The helper exports `project`, `polygon`, `polyline`, `plane`, `box`, `ring`, `cylinder` and `segment`, over `Point = [x, y, z]` and `View = { ox, oy, unit }`. The stylesheet carries the classes `figure`, `hi`, `edge`, `lo`, `dash`, `face` and `side`.
2. Copy `templates/iso-scene.tsx` beside them and rename it after the drawing, for example `HubScene.tsx`. It brings the components `Box`, `Cylinder`, `Line` and `FloorGrid` and the exported `IsoScene({ label })`.
3. Replace the placeholder scene in the copy with the shapes of the drawing, following the scene rules and the shape vocabulary.
4. Give the scene a label when it carries meaning. Without a label it stays hidden from assistive technology, which is right for a drawing that is only decoration.
5. Run `node .frontx/ai/@gears-frontx/template-design-guardrails/skills/frontx-design/scripts/check-iso-scene.mjs <scene.tsx>`. Exit 0 is clean, 1 lists findings, 2 means the input is wrong.

## Scene rules

- One drawing of 400 x 320: `viewBox="0 0 400 320"`, a 5:4 field, and the figure fills its slot's width.
- A floor grid in the `lo` tone, so the drawing stands on something.
- About 10 to 12 shapes at most. The floor grid is not counted among them.
- Exactly one highlighted element, in the `hi` tone. One point per drawing.
- Three line tones plus dash: `hi` for the one element that carries the point, `edge` for the other solids, `lo` for the grid and quiet lines, `dash` for a flow or a link.
- Every path comes from the helper. No hand-written path data, ever.
- Write each shape out as its own element, no `.map`, so the check counts what is drawn.
- No fixed colours and no fixed sizes in the scene. The stylesheet carries them, and every colour is a FrontX UI Kit token: `hi` is `var(--primary)`, `edge` is `var(--muted-foreground)`, `lo` is `var(--border)`, the face fill is `var(--card)`, the side fill is `var(--secondary)`, which stays a step away from `var(--card)` in light and dark themes alike.

## Shape vocabulary

| Shape | Helper | Use it for |
|---|---|---|
| Box | `box` | a tile, a card, a block, a server, a step |
| Cylinder | `cylinder` | a store, a dial, a post |
| Plane | `plane` | a sheet, a panel, a tray floor |
| Ring | `ring` | a dial, a lens rim, a target |
| Line / segment | `segment` | a wire, a link, a flow; `dash` for a flow |
| Polyline | `polyline` | a ruled line, a chart line on a sheet |
| FloorGrid | `FloorGrid` | the floor |

Build from the floor up, larger shapes behind and smaller in front, and keep one focal element. The eye lands where the `hi` tone is, so put it on the shape that carries the point.

## Worked examples

### Hub

A host tile on a floor grid, wired to the tiles around it, the host in the `hi` tone.

The view and the shapes that replace the placeholder:

```tsx
const view: View = { ox: 200, oy: 162, unit: 17 };
<Line view={view} from={[0, 0, 0.35]} to={[-3.7, -3.7, 0.2]} kind="dash" />
<Line view={view} from={[0, 0, 0.35]} to={[3.9, -3.2, 0.2]} kind="dash" />
<Line view={view} from={[0, 0, 0.35]} to={[-3.2, 3.9, 0.2]} kind="dash" />
<Line view={view} from={[0, 0, 0.35]} to={[4.3, 0.9, 0.2]} kind="dash" />
<Line view={view} from={[0, 0, 0.35]} to={[3.9, 3.9, 0.2]} kind="dash" />
<Box view={view} at={[-4.4, -4.4]} size={[1.4, 1.4, 0.45]} />
<Box view={view} at={[-1.7, -1.7]} size={[3.4, 3.4, 0.75]} tone="hi" />
<Box view={view} at={[3.2, -3.9]} size={[1.4, 1.4, 0.45]} />
<Box view={view} at={[-3.9, 3.2]} size={[1.4, 1.4, 0.45]} />
<Box view={view} at={[3.6, 0.2]} size={[1.4, 1.4, 0.45]} />
<Box view={view} at={[3.2, 3.2]} size={[1.4, 1.4, 0.45]} />
```

### Stack

A tree of tiles: the highlighted root wired to two tiles, which carry three leaves.

The view and the shapes that replace the placeholder:

```tsx
const view: View = { ox: 200, oy: 170, unit: 17 };
<Line view={view} from={[-4, -4, 0]} to={[-3, 1, 0.5]} />
<Line view={view} from={[-4, -4, 0]} to={[1, -3, 0.5]} />
<Line view={view} from={[-3, 1, 0]} to={[-2.3, 5.7, 0.45]} />
<Line view={view} from={[-3, 1, 0]} to={[1.7, 1.7, 0.45]} />
<Line view={view} from={[1, -3, 0]} to={[5.7, -2.3, 0.45]} />
<Box view={view} at={[-5, -5]} size={[2, 2, 0.6]} tone="hi" />
<Box view={view} at={[-3.8, 0.2]} size={[1.6, 1.6, 0.5]} />
<Box view={view} at={[0.2, -3.8]} size={[1.6, 1.6, 0.5]} />
<Box view={view} at={[-3, 5]} size={[1.4, 1.4, 0.45]} />
<Box view={view} at={[1, 1]} size={[1.4, 1.4, 0.45]} />
<Box view={view} at={[5, -3]} size={[1.4, 1.4, 0.45]} />
```

### Rest

Three plates at rest on posts, the top plate in the `hi` tone with a panel on it (a `plane` drawn as a path, so `plane` joins the helper import).

The view and the shapes that replace the placeholder:

```tsx
const view: View = { ox: 200, oy: 190, unit: 17 };
<Box view={view} at={[-4.2, -3.2]} size={[8.4, 6.4, 0.5]} />
<Cylinder view={view} at={[-3.4, -2.4]} r={0.22} h={1.1} z0={0.5} />
<Cylinder view={view} at={[3.4, -2.4]} r={0.22} h={1.1} z0={0.5} />
<Cylinder view={view} at={[-3.4, 2.4]} r={0.22} h={1.1} z0={0.5} />
<Cylinder view={view} at={[3.4, 2.4]} r={0.22} h={1.1} z0={0.5} />
<Box view={view} at={[-4.2, -3.2]} size={[8.4, 6.4, 0.5]} z0={1.6} />
<Cylinder view={view} at={[-3.4, -2.4]} r={0.22} h={1.1} z0={2.1} />
<Cylinder view={view} at={[3.4, -2.4]} r={0.22} h={1.1} z0={2.1} />
<Cylinder view={view} at={[-3.4, 2.4]} r={0.22} h={1.1} z0={2.1} />
<Cylinder view={view} at={[3.4, 2.4]} r={0.22} h={1.1} z0={2.1} />
<Box view={view} at={[-4.2, -3.2]} size={[8.4, 6.4, 0.5]} z0={3.2} tone="hi" />
<path className={styles.edge} d={plane(view, -2.4, -1.6, 4.8, 3.2, 3.7)} />
```

## Check

`check-iso-scene.mjs` reads the scene and reports: a missing or wrong `viewBox`, colour literals, literal path data, text or image elements, more than 12 shapes, and not exactly one highlighted element. Exit 0 is clean, 1 lists the findings, 2 means the input cannot be read.

It is a quick optional command, not a gate of design-verify. Run it when the scene changes, and treat a clean run as proof of the shape rules only, never as proof that the drawing carries its point.
