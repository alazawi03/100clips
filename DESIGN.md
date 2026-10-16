# Laqta Design System

**Direction:** Light mono + pink signature
**Version:** 2.0 (launch)
**Applies to:** brand web dashboard, creator mobile app, landing page, social and marketing

> The app name may change. Keep it in one constant (`APP_NAME`) and every design value in one theme file (`theme.ts`), so a rebrand is a small edit. Full code is in "For developers".

---

## 1. Brand in one line

Laqta (لقطة) is a GCC marketplace where brands hire local creators for short UGC clips. It should feel **premium and trustworthy to brands**, **local and authentic to Gulf creators**, and **respectful of Islamic values without being overtly religious**.

## 2. Principles

1. **Content first.** Clips and thumbnails carry the color. The interface stays calm around them.
2. **Black does the work, pink gives the personality.** Black for actions, pink for the brand's signature moments.
3. **Arabic first.** RTL is the base layout; English mirrors it, not the other way round.
4. **Values are visible.** Content rules (no music, modest dress, halal advertisers) are part of the product, shown clearly, never hidden in terms.
5. **One way to do each thing.** Reuse the same components, spacing and patterns everywhere.

---

## 3. Logo

**Launch logo:** the wordmark `laqta`, lowercase, bold, no symbol.

| Setting | Value |
|---|---|
| Font | Readex Pro Bold (700), width axis 0 |
| Letter spacing | −4% (−0.04em) |
| Kerning | Off (use the files, don't retype) |
| Color | Black `#111111` or white only |

| File | Use |
|---|---|
| `laqta-logo-black.svg` | Primary: web, documents, anything that scales |
| `laqta-logo-black.png` / `.jpg` | Where SVG isn't supported |
| `laqta-wordmark-white.png` | On pink, black or dark photos |
| `laqta-bilingual-dark.png` | Arabic-first contexts (لقطة over laqta) |
| `laqta-app-icon-pink-1024.png` | App Store / Play Store icon (white word on pink) |

**Rules**
- Never color the logo pink or violet. Pink is the logo's **background**, not its color.
- White logo on pink is the signature (app icon, social profile, banners).
- Clear space on every side = height of the letter **a**. Minimum 64 px wide on screen, 18 mm in print.
- Always left-to-right, never mirrored in RTL.
- Don't stretch, rotate, re-space, outline or add effects.

---

## 4. Color

### 4.1 The three jobs

| Color | Job | Rough share of an app screen |
|---|---|---|
| **Black** `#111111` | Actions and text: primary buttons, active tabs, icons, logo | Text + 1 button |
| **Pink** `#E11D74` | Signature: app icon, highlighted headline words, selected chips, "new" badges, story rings, marketing backgrounds | 5% or less |
| **Violet** `#6D4AFF` | Helper only: links, info notes, charts | Rare |

Everything else is white and gray. About **90% of any screen is white, gray and text**.

### 4.2 Light mode tokens

| Token | Hex | Use |
|---|---|---|
| `primary` | `#111111` | Primary buttons, active states, focus ring |
| `primary-hover` | `#2B2B2B` | Hover/press on primary |
| `on-primary` | `#FFFFFF` | Text on primary |
| `brand` | `#E11D74` | Pink signature (see 4.1) |
| `brand-hover` | `#C4155F` | Hover on pink elements |
| `brand-soft` | `#FDE7F0` | Selected chips, highlight backgrounds |
| `brand-on-soft` | `#A8104F` | Text and icons on `brand-soft` |
| `on-brand` | `#FFFFFF` | Text on pink |
| `link` | `#6D4AFF` | Links in text |
| `info-soft` | `#EFEAFF` | Info note background |
| `info-on-soft` | `#4B2FC9` | Info note text |
| `background` | `#FFFFFF` | Page background |
| `surface` | `#F5F5F5` | Cards, inputs, thumbnail placeholders |
| `border` | `#E5E5E5` | Dividers, card borders |
| `text` | `#111111` | Main text |
| `text-muted` | `#6B6B6B` | Secondary text, meta, captions |
| `icon-inactive` | `#8E8E8E` | Inactive tab and nav icons |
| `success` / `success-soft` | `#15803D` / `#E7F6EC` | Approved, paid, live |
| `success-on-soft` | `#166534` | Badge text on `success-soft` |
| `warning-soft` / `warning-on-soft` | `#FEF4E2` / `#9A5B00` | Pending review, changes requested |
| `error` / `error-soft` | `#C42E33` / `#FDECEC` | Rejected, failed, delete |
| `overlay` | `rgb(0 0 0 / 0.4)` | Behind modals and sheets |
| `scrim` | `rgb(0 0 0 / 0.6)` | Behind text on top of video |

### 4.3 Dark mode tokens

| Token | Hex |
|---|---|
| `primary` / `on-primary` | `#FFFFFF` / `#111111` (buttons invert) |
| `brand` / `on-brand` | `#FF4D94` / `#FFFFFF` |
| `brand-soft` / `brand-on-soft` | `#3A1426` / `#FF9EC4` |
| `link` | `#A78BFA` |
| `info-soft` / `info-on-soft` | `#2A2245` / `#C9BCFF` |
| `background` | `#111111` |
| `surface` | `#1F1F1F` |
| `border` | `#2E2E2E` |
| `text` / `text-muted` | `#FFFFFF` / `#A3A3A3` |
| `icon-inactive` | `#6B6B6B` |
| `success` / `success-soft` | `#4ADE80` / `#14301F` |
| `warning` / `warning-soft` | `#FBBF24` / `#3A2C12` |
| `error` / `error-soft` | `#F87171` / `#3A1A1C` |

### 4.4 Color rules
- **Primary buttons are black, never pink.** This keeps Laqta distinct from look-alike platforms and keeps pink special.
- **Pink never means error.** Errors are red (`error`), always with an icon and text.
- **Violet is only for links, info notes and charts.** No violet buttons, no violet backgrounds in the app.
- No colored text except links, status badges and pink highlighted words in marketing headlines.
- No gradients and no shadows (except floating elements; see 6).
- Status is always shown with **text** (and an icon where possible), never color alone.

### 4.5 Contrast — all pairs checked

| Pair | Ratio |
|---|---|
| White on black (`on-primary` / `primary`) | 18.9:1 |
| White on pink (`on-brand` / `brand`) | 4.5:1 light, 3.1:1 dark (white kept on pink in both themes) |
| Pink text on white | 4.5:1 |
| `brand-on-soft` on `brand-soft` | 6.3:1 |
| Violet link on white | 5.2:1 |
| `info-on-soft` on `info-soft` | 7.0:1 |
| `text-muted` on white / on `surface` | 5.3:1 / 4.9:1 |
| `icon-inactive` on white (icons, 3:1 needed) | 3.3:1 |
| `success-on-soft` on `success-soft` | 6.4:1 |
| `warning-on-soft` on `warning-soft` | 5.0:1 |
| `error` on `error-soft` / on white | 4.9:1 / 5.6:1 |
| Dark: pink `#FF4D94` on `#1F1F1F` | 5.3:1 |
| Dark: `text-muted` on `surface` | 6.5:1 |

Don't put pink text on `brand-soft` (3.9:1) or on `surface` (4.2:1). Use `brand-on-soft`.

---

## 5. Typography

| Script | Font | Fallback |
|---|---|---|
| Arabic + Latin (UI) | **Thmanyah Sans** | Readex Pro, IBM Plex Sans Arabic, system-ui |
| Logo | Readex Pro Bold (use the logo files) | — |

- One family for both scripts so mixed lines (brand names, handles, numbers inside Arabic) look even.
- If Thmanyah Sans files or licensing aren't ready, use **Readex Pro** everywhere (free on Google Fonts, matches the logo).
- Weights: Regular 400, Medium 500, Bold 700.
- Arabic can look slightly smaller than Latin at the same size. Add 1 px to Arabic `body` if needed.
- Numbers: Western digits (0–9) in both languages by default; revisit if users ask for Arabic-Indic digits.
- English UI text in sentence case.

### Type scale

| Token | Size / line height | Weight | Use |
|---|---|---|---|
| `display` | 32 / 40 (landing hero: 56 / 64) | 700 | Onboarding, empty states, hero |
| `h1` | 24 / 32 | 700 | Page titles |
| `h2` | 20 / 28 | 600 | Section titles |
| `h3` | 16 / 24 | 600 | Card titles |
| `body` | 15 / 24 | 400 | Default text |
| `body-strong` | 15 / 24 | 500 | Emphasis, labels |
| `small` | 13 / 20 | 400 | Meta, helper text |
| `caption` | 11 / 16 | 500 | Counts, durations (smallest size) |

Latin headings: `letter-spacing: -0.02em`. Never add letter spacing to Arabic.

---

## 6. Layout & spacing

- 4 px base. Scale `space-1` (4) to `space-12` (48): 4, 8, 12, 16, 20, 24, 32, 40, 48. Landing page sections can use 80–120. No values outside the scale.
- Radius: `radius-sm` 8 (inputs, small buttons, list thumbnails), `radius-md` 12 (buttons, cards), `radius-lg` 16 (large cards, modals, sheets), `radius-full` (chips, pills, avatars).
- Borders always 1 px `border`.
- **No shadows** on cards. Separate with space, `surface` and borders. Only floating menus get `0 8px 24px rgb(17 17 17 / 0.08)`.
- Modals and bottom sheets: `background` fill over `overlay`.

### Grid
- **Mobile:** 16 px side margins, single column.
- **Web dashboard:** fixed 240 px sidebar, content max 1200 px, 24 px gutters.
- **Breakpoints:** 640 / 1024 / 1280 px.

---

## 7. Direction & language

- Build RTL first. Use logical properties (`margin-inline-start`, `padding-inline-end`, `inset-inline-start`), never left/right.
- **Mirror:** layout direction, nav order, back arrows, chevrons, progress direction.
- **Don't mirror:** the logo, video player and media controls, numbers, phone numbers, clocks.
- Wrap Latin inside Arabic sentences (handles like `@noura.creates`, brand names, IBANs, prices) in `<bdi>` or `dir="ltr"`.
- All text exists in Arabic and English. No hard-coded strings in components.
- Language switch always available: top bar on web, Settings on mobile.
- Gregorian dates by default; Hijri as an optional secondary format (e.g. Ramadan campaigns).

---

## 8. Icons

- **Lucide**, outline only, stroke 1.5–2 px, consistent everywhere.
- Sizes: 16 inline (`icon-inline`), 20 default (`icon-default`), 24 navigation (`icon-nav`).
- Active nav icon: `text`. Inactive: `icon-inactive`.
- Don't mix filled and outline icons on one screen.

---

## 9. Components

### Button

| Variant | Class | Look | Use |
|---|---|---|---|
| Primary | `.lq-btn--primary` | Black fill, white text | The main action; one per screen |
| Secondary | `.lq-btn--secondary` | White fill, 1 px `border`, black text | Supporting actions |
| Ghost | `.lq-btn--ghost` | Transparent, black text | Minor actions, inline |
| Brand | `.lq-btn--brand` | Pink fill, white text | **Marketing only** (landing hero, campaigns). Never inside the app |
| Destructive | `.lq-btn--destructive` | `error` text, `error-soft` on hover | Delete, reject |

- Pill shape (`radius-full`) on the landing page; `radius-md` inside the app.
- Height 44 px mobile, 40 px web.
- Labels start with a verb, 1–3 words.
- Optional 20 px icon before the label (on the right in RTL).
- Avoid disabled buttons: keep them active and explain what's missing on tap.
- Icon-only buttons (`.lq-icon-btn`) are 44 × 44 with a bilingual `aria-label`.

### Chip
- `.lq-chip` on a `button`, state via `aria-pressed="true"`.
- 32 px tall, `radius-full`, `small` text.
- Default: 1 px `border`, `text-muted` text. Selected: `brand-soft` fill, `brand-on-soft` text.
- Not for actions; use Button.

### Input
- `.lq-field`, `.lq-field__label`, `.lq-input`, `.lq-field__help`.
- 44 px tall, `radius-sm`, `surface` fill, no border.
- Focus: 2 px `primary` (black) ring.
- Error: `aria-invalid="true"` → 1 px `error` border, helper text in `error` with an icon.
- Placeholder is a real example starting with "e.g." / «مثال:», never a repeat of the label.
- Link the message with `aria-describedby`.

### StatusBadge
Small pill with a soft background and dark text.

| State | Arabic | Class | Colors |
|---|---|---|---|
| Draft | مسودة | `.lq-badge--draft` | `surface` / `text-muted` |
| Live | مباشرة | `.lq-badge--success` | `success-soft` / `success-on-soft` |
| Pending review | بانتظار المراجعة | `.lq-badge--warning` | `warning-soft` / `warning-on-soft` |
| Changes requested | مطلوب تعديلات | `.lq-badge--warning` | `warning-soft` / `warning-on-soft` |
| Approved | مقبول | `.lq-badge--success` | `success-soft` / `success-on-soft` |
| Rejected | مرفوض | `.lq-badge--error` | `error-soft` / `error` |
| Completed | مكتملة | `.lq-badge--completed` | `brand-soft` / `brand-on-soft` |
| New | جديد | `.lq-badge--new` | `brand` / `on-brand` |

The text always distinguishes states that share a color.

### Card
- `.lq-card`: `background` + 1 px `border`. `.lq-card--surface`: `surface`, no border. `.lq-card--feature`: `radius-lg`.
- 16 px padding. Title in `h3`, meta in `small` + `text-muted`.
- No cards inside cards, no shadows, no colored borders.

### Avatar
- Sizes 32 / 40 / 56 / 80 (`--sm`, default, `--lg`, `--xl`), circular.
- No photo: initial on `brand-soft` in `brand-on-soft`.
- **Story ring** (new clips or active campaign): 2 px **pink**, 2 px `background` gap, then the photo. Seen/inactive: 2 px `border`. Never decorative.

### VideoCard
- 9:16 for clips; brand assets may use 16:9 or 1:1.
- `radius-md`, `surface` while loading.
- On the video: only views and duration, white `caption` on `scrim`.
- Title and handle **below** the card. Wrap the handle in `<bdi>`.
- The media area is `direction: ltr` so player controls never mirror.

### TabBar (creator app)
- Five items: Home, Explore, **Post** (center), Campaigns, Profile. Starts from the right in RTL.
- Post button: black circle with a white plus; a small pink dot if there's a pending brief.
- 24 px icons; active `text` (`aria-current="page"`), inactive `icon-inactive`. 44 px touch targets.

### Sidebar (brand dashboard)
- 240 px, on the right in RTL (`border-inline-start`).
- Items: 20 px icon + label, 40 px tall.
- Active: `surface` fill, `text` label, a 3 px pink bar on the inline-start edge.
- Logo at the top.

### TopBar (web)
- RTL order: page title (right) → search → notifications → language switch («EN» / «ع») → account (left).
- Title in `h1`. Bottom 1 px `border`, no shadow.

### EmptyState
- Short title naming the place, in `display`: «أطلق حملتك الأولى» / "Launch your first campaign".
- One line in `text-muted`. One primary button.
- No sad illustrations, no apologies.

### ContentRules
Shown when a brand creates a campaign and before a creator films.
- Neutral `surface` card with a small black check icon. **Not** red, not warning-style: these are values, not errors.
- Fixed rules: no music; modest dress (women creators cover their hair); no prohibited ad categories.
- Brand agrees with a checkbox (`.lq-check`) when creating a campaign.
- On upload, if music is detected, show a `warning` badge with the next step.
- Prohibited categories (interest-based loans, alcohol, gambling, non-halal products) never appear as options at sign-up or campaign creation.

---

## 10. Motion

| Token | Value | Use |
|---|---|---|
| `duration-fast` | 120 ms | Hover, press, toggles |
| `duration-base` | 200 ms | Sheets, dropdowns, tab changes |
| `duration-slow` | 320 ms | Page transitions, celebration moments |

- ease-out for entering, ease-in for leaving.
- Like/approve: quick pulse (1 → 1.15 → 1) in pink.
- Respect `prefers-reduced-motion`.

---

## 11. Voice & copy

- Friendly, direct, short. Gulf-flavored Arabic, plain English.
- Talk to the user directly and use possessives: «حملاتك»، «مقاطعك» / "Your campaigns".
- Buttons start with a verb:

| Arabic | English |
|---|---|
| أنشئ حملة | Create campaign |
| راجع المقاطع | Review clips |
| اعتمد المقطع | Approve clip |
| انشر مقطع | Post clip |
| وظّف صانع المحتوى | Hire creator |

- Errors say what happened and what to do next: «حجم الملف أكبر من 100 ميجابايت. جرّب مقطعًا أقصر.» / "That file is over 100 MB. Try a shorter clip."
- No «من فضلك», «بنجاح» or exclamation marks in system messages. Same in English: no "please", "successfully" or "!".
- Never invent numbers, testimonials or partner logos.

---

## 12. Imagery

- Real creator clips and products, not stock photos.
- Modest and respectful: women creators with covered hair, modest clothing for everyone, no music or nightlife scenes, no haram products.
- Gulf settings: homes, cafés, majlis, souqs, malls, desert, beach.
- Clips always 9:16; in marketing, show them in phone frames or floating cards.
- Marketing may use pink backgrounds and pink highlighted words. Inside the app, backgrounds stay white.

---

## 13. Accessibility

- Contrast: 4.5:1 for normal text, 3:1 for large text and icons. Use only the pairs in 4.5.
- Touch targets at least 44 × 44 px.
- Icon-only buttons have bilingual `aria-label`s.
- Never rely on color alone for status.
- Focus ring: solid 2 px `primary`, 2 px offset.
- Encourage captions on clips (also helpful since music isn't allowed).

---

## 14. For developers

### `theme.ts` (single source of truth)

```ts
export const APP_NAME = "laqta";

export const colors = {
  light: {
    primary: "#111111",
    primaryHover: "#2B2B2B",
    onPrimary: "#FFFFFF",
    brand: "#E11D74",
    brandHover: "#C4155F",
    brandSoft: "#FDE7F0",
    brandOnSoft: "#A8104F",
    onBrand: "#FFFFFF",
    link: "#6D4AFF",
    infoSoft: "#EFEAFF",
    infoOnSoft: "#4B2FC9",
    background: "#FFFFFF",
    surface: "#F5F5F5",
    border: "#E5E5E5",
    text: "#111111",
    textMuted: "#6B6B6B",
    iconInactive: "#8E8E8E",
    success: "#15803D",
    successSoft: "#E7F6EC",
    successOnSoft: "#166534",
    warning: "#B45309",
    warningSoft: "#FEF4E2",
    warningOnSoft: "#9A5B00",
    error: "#C42E33",
    errorSoft: "#FDECEC",
  },
  dark: {
    primary: "#FFFFFF",
    primaryHover: "#E5E5E5",
    onPrimary: "#111111",
    brand: "#FF4D94",
    brandHover: "#FF6BA6",
    brandSoft: "#3A1426",
    brandOnSoft: "#FF9EC4",
    onBrand: "#FFFFFF",
    link: "#A78BFA",
    infoSoft: "#2A2245",
    infoOnSoft: "#C9BCFF",
    background: "#111111",
    surface: "#1F1F1F",
    border: "#2E2E2E",
    text: "#FFFFFF",
    textMuted: "#A3A3A3",
    iconInactive: "#6B6B6B",
    success: "#4ADE80",
    successSoft: "#14301F",
    successOnSoft: "#4ADE80",
    warning: "#FBBF24",
    warningSoft: "#3A2C12",
    warningOnSoft: "#FBBF24",
    error: "#F87171",
    errorSoft: "#3A1A1C",
  },
};

export const fonts = {
  sans: ["Thmanyah Sans", "Readex Pro", "IBM Plex Sans Arabic", "system-ui", "sans-serif"],
  weights: { regular: 400, medium: 500, bold: 700 },
};

export const radius = { sm: 8, md: 12, lg: 16, full: 999 };
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48 };
export const motion = { fast: 120, base: 200, slow: 320 };
```

### CSS variables

Dark mode follows the system and can be forced with `data-theme="dark"` on `<html>`.

```css
:root {
  --primary: #111111;
  --primary-hover: #2B2B2B;
  --on-primary: #FFFFFF;
  --brand: #E11D74;
  --brand-hover: #C4155F;
  --brand-soft: #FDE7F0;
  --brand-on-soft: #A8104F;
  --on-brand: #FFFFFF;
  --link: #6D4AFF;
  --info-soft: #EFEAFF;
  --info-on-soft: #4B2FC9;
  --background: #FFFFFF;
  --surface: #F5F5F5;
  --border: #E5E5E5;
  --text: #111111;
  --text-muted: #6B6B6B;
  --icon-inactive: #8E8E8E;
  --success: #15803D;
  --success-soft: #E7F6EC;
  --success-on-soft: #166534;
  --warning: #B45309;
  --warning-soft: #FEF4E2;
  --warning-on-soft: #9A5B00;
  --error: #C42E33;
  --error-soft: #FDECEC;
  --overlay: rgb(0 0 0 / 0.4);
  --scrim: rgb(0 0 0 / 0.6);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --primary: #FFFFFF;
    --primary-hover: #E5E5E5;
    --on-primary: #111111;
    --brand: #FF4D94;
    --brand-hover: #FF6BA6;
    --brand-soft: #3A1426;
    --brand-on-soft: #FF9EC4;
    --on-brand: #FFFFFF;
    --link: #A78BFA;
    --info-soft: #2A2245;
    --info-on-soft: #C9BCFF;
    --background: #111111;
    --surface: #1F1F1F;
    --border: #2E2E2E;
    --text: #FFFFFF;
    --text-muted: #A3A3A3;
    --icon-inactive: #6B6B6B;
    --success: #4ADE80;
    --success-soft: #14301F;
    --success-on-soft: #4ADE80;
    --warning: #FBBF24;
    --warning-soft: #3A2C12;
    --warning-on-soft: #FBBF24;
    --error: #F87171;
    --error-soft: #3A1A1C;
  }
}
/* Repeat the dark values under :root[data-theme="dark"] */
```

### Tailwind v4

Add after `@import "tailwindcss";` to get classes like `bg-surface`, `text-text-muted`, `bg-brand`.

```css
@theme inline {
  --color-primary: var(--primary);
  --color-primary-hover: var(--primary-hover);
  --color-on-primary: var(--on-primary);
  --color-brand: var(--brand);
  --color-brand-hover: var(--brand-hover);
  --color-brand-soft: var(--brand-soft);
  --color-brand-on-soft: var(--brand-on-soft);
  --color-on-brand: var(--on-brand);
  --color-link: var(--link);
  --color-info-soft: var(--info-soft);
  --color-info-on-soft: var(--info-on-soft);
  --color-background: var(--background);
  --color-surface: var(--surface);
  --color-border: var(--border);
  --color-text: var(--text);
  --color-text-muted: var(--text-muted);
  --color-icon-inactive: var(--icon-inactive);
  --color-success: var(--success);
  --color-success-soft: var(--success-soft);
  --color-success-on-soft: var(--success-on-soft);
  --color-warning: var(--warning);
  --color-warning-soft: var(--warning-soft);
  --color-warning-on-soft: var(--warning-on-soft);
  --color-error: var(--error);
  --color-error-soft: var(--error-soft);

  --font-sans: "Thmanyah Sans", "Readex Pro", "IBM Plex Sans Arabic", system-ui, sans-serif;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-full: 999px;

  --spacing: 4px;

  --breakpoint-sm: 640px;
  --breakpoint-md: 1024px;
  --breakpoint-lg: 1280px;
}
```

### Page setup

```tsx
<html lang="ar" dir="rtl">
```

- Switch `lang` and `dir` together (`en` / `ltr`).
- Use logical Tailwind classes: `ms-4`, `pe-2`, `start-0` (not `ml-4`, `pr-2`, `left-0`).
- Flip directional icons with `rtl:-scale-x-100`.
- Never flip the video player or the logo.

---

## 15. Checklist before shipping a screen

- [ ] Mostly white, gray and black? Pink used only for signature moments?
- [ ] One black primary button; no pink buttons inside the app?
- [ ] Violet only on links, info notes or charts?
- [ ] Logo black or white, never colored?
- [ ] Works in RTL and LTR?
- [ ] Only contrast pairs from 4.5?
- [ ] Status shown with text (and icon)?
- [ ] Content rules visible where relevant; imagery modest, no music?
- [ ] No invented stats, testimonials or logos?