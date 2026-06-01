# Character V2 Chroma-Key Pipeline

Date: 2026-06-01

Purpose: generate unified DYOR character assets from the new PNG references using the built-in image generator, a flat `#00ff00` chroma-key source, and local alpha extraction.

## Current Mode

Use this pipeline unless the founder explicitly switches back to native API transparency.

- Generate source PNG on a perfectly flat `#00ff00` background.
- Keep the subject fully separated from the background.
- Do not use green in the subject.
- Remove the background with:

```bash
python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/imagegen/scripts/remove_chroma_key.py" \
  --input <source-green.png> \
  --out <final-alpha.png> \
  --auto-key border \
  --soft-matte \
  --transparent-threshold 12 \
  --opaque-threshold 220 \
  --despill
```

## Shared Prompt Core

```text
Use case: style-transfer / game character asset.

Create a DYOR character asset from the visible reference image. Convert the reference into the unified DYOR 2.5D toy-comic style while preserving the character identity, hair, outfit idea, pose attitude, props, and reference detail level.

Style: collectible vinyl toy meets editorial cartoon; matte clay/plastic textures; hand-sculpted details close to the reference; expressive face; bold readable silhouette; soft rim shadows on the character only; mobile-game readable; not flat vector, not overly realistic 3D.

Composition: waist-up portrait/profile-card asset, centered, generous padding, same attitude as the reference, no text, no logos, no real brands. Adapt proportions slightly toward current DYOR characters: compact body, larger readable head/hands, adult and not chibi.

Chroma-key background: perfectly flat solid #00ff00 background for local alpha extraction. The background must be one uniform color with no shadows, gradients, texture, reflections, floor plane, halo, or lighting variation. Do not use #00ff00 anywhere in the subject. No cast shadow, no contact shadow, no watermark.

Palette: keep the reference color identity, compatible with deep black-blue DYOR UI; accents may use #F5A524, #E84B2A, #A78BFA, #28C76F, #5BD7E0.

Avoid: Monopoly mascot, Mario style, Disney/Pixar clone, generic Memoji/Bitmoji/Roblox avatar, anime style, casino slot art, glossy gradients, real logos, real politicians, real investment advice, flat corporate SaaS illustration.
```

## First-Pass Outputs

Generated source-green files:

- `apps/web/src/assets/generated/characters/burnout_clerk/portraits/burnout_clerk_profile_bust-source-green.png`
- `apps/web/src/assets/generated/characters/deal_maven/portraits/deal_maven_profile_bust-source-green.png`
- `apps/web/src/assets/generated/characters/whale_broker/portraits/whale_broker_profile_bust-source-green.png`
- `apps/web/src/assets/generated/characters/street_hustler/portraits/street_hustler_profile_bust-source-green.png`
- `apps/web/src/assets/generated/characters/fixer_consultant/portraits/fixer_consultant_profile_bust-source-green.png`

Generated alpha files:

- `apps/web/src/assets/generated/characters/burnout_clerk/portraits/burnout_clerk_profile_bust.png`
- `apps/web/src/assets/generated/characters/deal_maven/portraits/deal_maven_profile_bust.png`
- `apps/web/src/assets/generated/characters/whale_broker/portraits/whale_broker_profile_bust.png`
- `apps/web/src/assets/generated/characters/street_hustler/portraits/street_hustler_profile_bust.png`
- `apps/web/src/assets/generated/characters/fixer_consultant/portraits/fixer_consultant_profile_bust.png`

QA preview:

- `tmp/imagegen/character-v2-alpha/portrait-contact-sheet.png`

## QA Result

- All five final portrait PNGs are `1024x1536` RGBA.
- All four image corners have alpha `0`.
- Source-green files are retained beside final PNGs for retry/debug.
- The contact sheet uses checkerboard only as a preview background; it is not part of the character assets.

## Next Pass

Generate `front`, `three_quarter`, `side`, and `back_three_quarter` for one approved character first, then repeat for the others. Keep the same prompt core, but replace composition with the requested view.

## Role Pass: Rapper, Cashier, Teacher

Founder request: add a rapper woman, cashier woman, and teacher woman from `/Users/dzmitrysiarou/Documents/png refs`, preserving the richer reference detail level and keeping bust portraits close to source.

Character ids and source refs:

- `rap_queen`
  - Primary: `apps/web/src/assets/generated/characters/rap_queen/references/source-reference.png`
  - Variants: `full-body-alt-reference.png`, `portrait-alt-reference.png`
  - Prompt: `apps/web/src/assets/generated/characters/rap_queen/prompts/profile_bust.md`
- `checkout_cashier`
  - Primary: `apps/web/src/assets/generated/characters/checkout_cashier/references/source-reference.png`
  - Prompt: `apps/web/src/assets/generated/characters/checkout_cashier/prompts/profile_bust.md`
- `classroom_teacher`
  - Primary: `apps/web/src/assets/generated/characters/classroom_teacher/references/source-reference.png`
  - Variant: `hair-style-alt-blonde-reference.png`
  - Prompt: `apps/web/src/assets/generated/characters/classroom_teacher/prompts/profile_bust.md`

Generation notes:

- Bust portraits should stay nearly source-faithful in face, hair, pose attitude, and outfit read.
- Full-body views can move toward current DYOR proportions: compact body, larger readable head/hands, adult and not chibi.
- Preserve optional-asset compatibility with manifest `variantSlots` so hair, glasses, jewelry, work props, and handheld props can become interchangeable later.
- Keep all real logos, real brands, real artists, real schools, and real financial symbols out of the final assets.

Generated source-green files:

- `apps/web/src/assets/generated/characters/rap_queen/portraits/rap_queen_profile_bust-source-green.png`
- `apps/web/src/assets/generated/characters/checkout_cashier/portraits/checkout_cashier_profile_bust-source-green.png`
- `apps/web/src/assets/generated/characters/classroom_teacher/portraits/classroom_teacher_profile_bust-source-green.png`

Generated alpha files:

- `apps/web/src/assets/generated/characters/rap_queen/portraits/rap_queen_profile_bust.png`
- `apps/web/src/assets/generated/characters/checkout_cashier/portraits/checkout_cashier_profile_bust.png`
- `apps/web/src/assets/generated/characters/classroom_teacher/portraits/classroom_teacher_profile_bust.png`

QA preview:

- `tmp/imagegen/character-v2-alpha/portrait-contact-sheet-role-pass.png`

QA result:

- All three final portrait PNGs are `1024x1536` RGBA.
- All four image corners have alpha `0`.
- Source-green files are retained beside final PNGs for retry/debug.
