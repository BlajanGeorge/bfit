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

### Group-level cards to generate (11)

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
| Forearms | front | forearm muscles |

### Sub-group cards (same template, highlight only the finer part)

Tip: zoom/crop toward the relevant body part for clarity, and pass the matching
group card as style reference.

| Group | Sub-group | VIEW | MUSCLE (highlight) |
|-------|-----------|------|--------------------|
| Chest | Upper | front | upper (clavicular) pectoral |
| Chest | Mid | front | mid (sternal) pectoral |
| Chest | Lower | front | lower pectoral |
| Back | Lats | back | latissimus dorsi (the side "wings") |
| Back | Mid Back | back | rhomboids & mid-trapezius (between shoulder blades) |
| Back | Traps | back | upper trapezius (neck / upper shoulders) |
| Back | Lower Back | back | erector spinae (lower back) |
| Shoulders | Front Delt | front | anterior deltoid (front of shoulder) |
| Shoulders | Lateral Delt | front 3/4 | lateral (side) deltoid |
| Shoulders | Rear Delt | back | posterior (rear) deltoid |
| Biceps | Long Head | front | outer biceps (long head) |
| Biceps | Short Head | front | inner biceps (short head) |
| Triceps | Long Head | back | inner long head of triceps |
| Triceps | Lateral Head | back | outer lateral head of triceps |
| Abs | Upper Abs | front | upper rectus abdominis |
| Abs | Lower Abs | front | lower rectus abdominis |
| Abs | Obliques | front | oblique muscles (sides of the waist) |
| Forearms | Flexors | front | forearm flexors (inner forearm) |
| Forearms | Extensors | back | forearm extensors (outer forearm) |

Later we'll also need **animations** (per exercise `id`) showing how each exercise
is performed — separate pass.
