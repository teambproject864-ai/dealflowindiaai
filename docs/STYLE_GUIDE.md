# Dealflow AI - Official Design System & Style Guide

## 1. Visual Hierarchy & Core Color Tokens

Dealflow AI uses a curated, WCAG 2.1 AA compliant color system designed for rich dark modes, vibrant accents, and high legibility.

### Primary Color Palettes (HSL Tailored)
- **Primary Teal**: `hsl(173, 80%, 40%)` (`#14b8a6`) - Used for primary actions, success states, and brand highlights.
- **Royal Violet**: `hsl(263, 70%, 50%)` (`#7c3aed`) - Used for AI features, agent workspace tags, and secondary accents.
- **Electric Cyan**: `hsl(189, 94%, 43%)` (`#06b6d4`) - Used for live metrics, interactive telemetry, and hover glows.
- **Dark Slate Background**: `hsl(222, 47%, 7%)` (`#0f172a` / `#090d16`) - Core application background depth.
- **Card Glass Surface**: `rgba(30, 41, 59, 0.75)` with `backdrop-filter: blur(16px)` and `border: 1px solid rgba(255, 255, 255, 0.08)`.

### Typography Standards
- **Primary Sans Font**: Inter, system-ui, -apple-system, BlinkMacSystemFont.
- **Monospace Font**: JetBrains Mono, Fira Code, monospace for metrics, API keys, and code snippets.

---

## 2. Accessibility & Contrast Guidelines (WCAG 2.1 AA)

1. **Text Contrast Ratios**:
   - Normal text (below 18pt / 24px): Minimum contrast ratio of **4.5:1** against dark slate surfaces.
   - Large text (above 18pt or 14pt bold): Minimum contrast ratio of **3.0:1**.
2. **Keyboard Navigation & Focus Rings**:
   - All interactive elements (`<button>`, `<a>`, `<input>`, `<select>`) must feature visible focus rings (`focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:outline-none`).
3. **Screen Reader Compliance**:
   - Form controls must use explicit `<label>` bindings or `aria-label`.
   - Modals and tabs must use standard ARIA roles (`role="dialog"`, `role="tablist"`, `role="tab"`, `aria-selected`).

---

## 3. Micro-Animations & Motion Tokens

1. **Timing & Easing**:
   - Standard Motion Curve: `cubic-bezier(0.22, 1, 0.36, 1)` (smooth deceleration).
   - Fast State Changes (hover, active): `150ms` - `200ms`.
   - Structural Transitions (drawer open, modal enter): `300ms` - `400ms`.
2. **Performance Constraints**:
   - Only animate hardware-accelerated CSS properties (`transform`, `opacity`). Avoid animating `height`, `width`, or `margin` to guarantee **60fps** rendering performance.

---

## 4. Glassmorphism & Depth Layers

- **Depth 1 (Base Cards)**: `bg-slate-900/80 backdrop-blur-md border border-white/5 shadow-lg`
- **Depth 2 (Floating Popovers/Modals)**: `bg-slate-900/90 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/50`
- **Glow Accents**: `shadow-[0_0_20px_rgba(20,184,166,0.15)]`
