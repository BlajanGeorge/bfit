# B-Fit — Assets spec

## Muscle-group cards (image assets)

We need one card image per **muscle group**, and later one per **sub-group**:
an anatomical human figure with the **target muscle highlighted in red** (like a
biology / muscle-map chart). They must look like a **consistent set** (same body,
pose, style, lighting) so the cards line up nicely in the app.

### Style / consistency

- Same neutral muscular anatomical figure across ALL images (front or back view
  as appropriate for the muscle).
- Clean semi-realistic **anatomical muscle-map illustration** (like fitness-app
  muscle diagrams), not gory.
- **Only the target muscle is highlighted red/glowing**; the rest of the body is
  a muted neutral tone (grey/desaturated).
- **Transparent background**, centered, full figure (or the relevant body part),
  even lighting, no text, no labels, 1:1, high-res.
- Generate the first image, then use it as a **style reference** for all the rest
  so the body/pose/style stay identical.

### Reusable prompt template

```
Anatomical muscle-map illustration of a single muscular human body, [VIEW] view,
standing in a neutral symmetrical pose. Clean semi-realistic fitness-app anatomy
style. The [MUSCLE] is clearly HIGHLIGHTED IN GLOWING RED; all other muscles are
a muted neutral grey. Centered, full figure, even lighting, isolated on a plain
transparent background, single figure, no text, no labels, no arrows, no border,
1:1, high resolution.
```

### Status

Group cards live in `assets/muscles/<group>.png`. **10/10 done** — chest, back,
shoulders, biceps, triceps, quadriceps, hamstrings, glutes, calves, abs
(forearms removed from the app).

### Group-level cards to generate (10)

| Group | VIEW | MUSCLE (highlight) |
|-------|------|--------------------|
| Chest | front | pectoral muscles (chest) |
| Back | back | latissimus dorsi and mid-back |
| Shoulders | front 3/4 | deltoids (shoulders) |
| Biceps | front | biceps (front upper arms) |
| Triceps | back | triceps (back of upper arms) |
| Quadriceps | front | quadriceps (front thighs) |
| Hamstrings | back | hamstrings (back thighs) |
| Glutes | back | gluteal muscles (buttocks) |
| Calves | back | calf muscles (lower legs) |
| Abs | front | abdominal muscles (core) |

### Sub-group cards

**Not needed.** Selecting a group goes straight to its exercises — there are no
sub-group screens, so only the 10 group cards above are required.

Later we'll also need **animations** (per exercise `id`) showing how each exercise
is performed — separate pass.
