# VidGrab — Web Design System

Source of truth for layout, type, and spacing.  
Based on international practice (not a single brand kit):

| Source | What we take |
|--------|----------------|
| **Typography / measure** (Bringhurst, Baymard, WCAG reading research) | Body line length **45–75 characters**; target **~65ch** for prose |
| **8-point grid** (Material Design, Carbon, Polaris) | Spacing = multiples of **4 / 8 px** |
| **Responsive containers** (Bootstrap / Tailwind convention) | Shell ~**1120px**; form column ~**640px** |
| **Touch / a11y** (Apple HIG, WCAG 2.5.5) | Interactive targets **≥ 44×44 CSS px** |
| **Locale** | Product default **`vi`**; copy may run longer than EN — keep form column stable |

---

## 1. Layout tokens (CSS)

Declared in `src/app/globals.css` `:root`. Components **must** use these names — not ad-hoc `max-w-*` that fight the system.

| Token | Value | px @16 | Role |
|-------|--------|--------|------|
| `--shell-max` | `80rem` | **1280** | Nav / outer chrome. Product shell (Material large / common SaaS). On 1920×1080 (16:9) → ~320px margin each side. **Always centered** via `margin-inline: auto`. |
| `--section-max` | `72rem` | **1152** | Marketing blocks (platforms, features). Near-full shell so sections don’t look like a left stamp. |
| `--form-max` | `48rem` | **768** | Primary task: URL field, results, history. Wider task column for VI labels + desktop comfort. |
| `--measure-prose` | `65ch` | ~650* | Legal / long copy only. Ideal reading measure (mid of 45–75ch). |
| `--page-gutter` | fluid | 16→24→32 | Side padding. Mobile **1rem**, `sm+` **1.5rem**, `lg+` **2rem**. |

### Centering rule (critical)

Containers use `width: 100%; max-width: var(--*); margin-inline: auto`.  
They must **never** look glued to the top-left: on wide screens the block sits in the **horizontal center**, with equal empty space left and right.

\*Depends on font metrics; `ch` tracks the “0” glyph of the active font.

### Why not full-bleed on 16:9?

Wide monitors (1920+) make **100% width** feel “stretched” and hurt scanability.  
International product UIs cap content and grow **margin**, not line length.

```
Viewport 1920px
├── ~320px ── [ shell 1280 centered ] ── ~320px ──
                 └── form 768 centered inside shell
```

---

## 2. Spacing scale (8-pt)

| Token | rem | px | Use |
|-------|-----|-----|-----|
| `--space-1` | 0.25 | 4 | Hair gaps, icon padding |
| `--space-2` | 0.5 | 8 | Compact control gap |
| `--space-3` | 0.75 | 12 | Dense lists |
| `--space-4` | 1 | 16 | Default component gap |
| `--space-5` | 1.5 | 24 | Card padding, section inner |
| `--space-6` | 2 | 32 | Between related blocks |
| `--space-8` | 3 | 48 | Section vertical rhythm |
| `--space-10` | 4 | 64 | Large section breaks |

Section vertical padding: **`py` ≈ `--space-8`–`--space-10`** (48–64px), not arbitrary 13/17px values.

---

## 3. Breakpoints

Aligned with Tailwind defaults (industry default for React/Next):

| Name | min-width | Intent |
|------|-----------|--------|
| default | 0 | Phone |
| `sm` | 640px | Large phone / small tablet |
| `md` | 768px | Tablet |
| `lg` | 1024px | Laptop |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Wide / 16:9 large |

Layout rules only change gutters and optional column counts — **max content widths stay the same** above `lg` so 16:9 does not re-stretch content.

---

## 4. Typography

| Role | Guidance |
|------|----------|
| Body | `line-height` **1.5–1.6** (WCAG-friendly); `letter-spacing` slight negative only on display |
| Display / H1 | Clamp size; prefer **≤ ~2.75rem** on large screens for VI headlines (longer than EN) |
| Prose | `max-width: var(--measure-prose)` (65ch) |
| UI labels | Single-line where possible; no wrap on primary CTAs / nav actions |

Default language: **`vi`** (see `src/lib/i18n.tsx`).

---

## 5. Interaction / a11y floors

- Focus: visible `:focus-visible` ring ≥ 3:1 contrast against background  
- Primary buttons / main actions: **min-height 44px**  
- Compact icon buttons: **min 36–44px** hit area  
- `overflow-x: clip` on `html`/`body` (no horizontal page scroll)  
- Prefer `transform` / `opacity` for motion; respect `prefers-reduced-motion`

---

## 6. Component mapping

| UI area | Token |
|---------|--------|
| Top nav | `--shell-max` |
| Hero copy + form | `--section-max` shell, form `--form-max` |
| Error / result / format picker / history | `--form-max` |
| Platforms, features, FAQ, footer, tech credits | `--section-max` |
| Privacy / terms / transparency body | `--measure-prose` or `--section-max` (whichever is smaller for that block) |

---

## 7. Change control

1. Edit **this file** first when changing layout philosophy.  
2. Update CSS variables in `globals.css` to match.  
3. Components only reference **tokens**, not new one-off max-widths.

Last updated: 2026-07-15
