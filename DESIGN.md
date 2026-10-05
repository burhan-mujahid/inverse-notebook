# Inverse design system

## Direction

A researcher working at a bright desk adjusts a mechanical diagram and compares small numeric changes. Use a light, restrained instrument-like interface: white drawing surface, quiet neutral panels, dark readable text, and a concentrated indigo accent for editable results and primary actions.

The brand seed is hue 270. Use deep indigo rather than pastel purple treatments. Functional engineering diagrams carry the visual identity; no decorative illustrations are needed.

## Tokens

```css
--bg: oklch(1 0 0);
--surface: oklch(0.975 0.004 270);
--surface-strong: oklch(0.945 0.007 270);
--ink: oklch(0.23 0.02 270);
--muted: oklch(0.47 0.025 270);
--line: oklch(0.88 0.012 270);
--primary: oklch(0.45 0.18 270);
--primary-soft: oklch(0.95 0.025 270);
--success: oklch(0.4 0.105 155);
--warning: oklch(0.43 0.11 50);
--danger: oklch(0.47 0.18 25);
```

Use system sans-serif for the interface and a system monospace for equations and tabular numbers. Body text 14–16px; heading scale fixed rather than viewport-fluid. Borders define panels; avoid paired wide shadows and borders. Corners 6–12px, small for controls.

## Layout

A thin masthead carries the name, notebook identity, save state, and Guide/Export actions. The workspace title and a single instructional sentence precede a two-column workbench. The diagram and output controls occupy the wide column; parameters and constraints occupy the narrow column. A proposal section reports changes and allows Apply. History follows the computational surface rather than becoming a navigation sidebar.

Below approximately 900px use a single column. Keep the diagram legible with a consistent SVG viewBox. Numeric controls remain usable at 320px wide.

## Diagram conventions

- Solid indigo: candidate beam and current candidate endpoint.
- Thin gray dashed line: committed reference shape.
- Labeled guide: desired output, including an unreachable target.
- The horizontal drawing is schematic; displayed length is the numerical source of truth.
- Vertical deflection is magnified and its display scale is labeled.
- The diagram never claims to be a finite-element simulation.

## Interaction states

Maintain a visible focus ring. Locks use both icons/text and aria-pressed. Disabled Apply has an explanation. Invalid fields have inline errors and retain the last valid committed state. Busy/recomputation should not require a spinner for the bounded synchronous solver. Announce final proposal status politely, without flooding assistive technology during every pointer move.

A drag creates a proposal anchored to the committed state. Pointer release preserves that proposal. Apply commits it. Escape cancels. Keyboard adjustments target the same output as pointer movement. Undo/redo operate on complete committed notebook states.

## Motion

Use only brief color/state transitions. Do not animate the solver output behind the user's pointer. Under prefers-reduced-motion, disable nonessential transitions. No entrance choreography.
