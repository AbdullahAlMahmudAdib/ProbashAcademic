# ProbashAcademic 3.0 — Full UI Redesign

## Overview

Complete visual redesign of all pages using a modern, 3D-accented design language. Green is excluded from the palette. Approach is **Hybrid** (Approach 2): 3D elements on hero pages, premium glassmorphism UI everywhere else, powered by Motion, GSAP, and Three.js.

## Color Palette

| Role | Color | Hex |
|------|-------|-----|
| Primary (deep) | Indigo Night | `#0f0e2e` → `#1e1b4b` |
| Primary (mid) | Royal Indigo | `#3730a3` |
| Accent | Warm Amber | `#f59e0b` |
| Secondary Accent | Coral | `#fb7185` |
| Surface | Glass White | `rgba(255,255,255,0.55)` |
| Surface (dark) | Glass Dark | `rgba(15,14,46,0.75)` |
| Text Primary | Rich Charcoal | `#1a1a2e` |
| Text Muted | Warm Slate | `#787885` |
| Body BG | Warm Light | `#f8f6f2` |
| Border | Subtle | `rgba(0,0,0,0.06)` |

## 3D Elements per Page

| Priority | Pages | 3D Level |
|----------|-------|----------|
| P1 | Home, Scholarships, Chat | Three.js canvas hero + GSAP scroll |
| P2 | Dashboard, Guide, Profile | Glass cards, micro-anims |
| P3 | Auth, Legal, SOP, Visa Score | Clean gradient mesh, no WebGL |

## Design Tokens (CSS Variables)

Replaces `--teal-*`, `--coral-*`, `--sand-*`, `--sky-*` with:

- `--indigo-*` (deep navy → light indigo)
- `--amber-*` (warm golds)
- `--coral-*` (keep but shift warmer)
- `--surface-*` for glass effects
- `--glass-*` for backdrop-blur utilities

## Component Styles

- **Cards**: `background: var(--glass-bg)`, `backdrop-filter: blur(12px)`, `border: 1px solid var(--glass-border)`
- **Buttons**: Gradient indigo→amber, pill, spring micro-bounce
- **Navbar**: Sticky glass, `backdrop-filter: blur(16px)`
- **Typography**: Fraunces (headings) at larger scale, Manrope (body)
- **Focus rings**: Indigo instead of teal

## Skills Used

- `modern-web-design` — layout, spacing, typography system
- `motion-framer` — micro-interactions, page transitions
- `gsap-scrolltrigger` — scroll reveals, parallax
- `threejs-webgl` — hero 3D scenes
- `web3d-integration-patterns` — Three.js + GSAP + Motion coordination
- `lightweight-3d-effects` — subtle 3D touches

## Pages Scope (20+ pages)

Landing, Scholarships list/detail, Chat, Dashboard, Guide list/detail, Profile, Auth (login/signup/forgot), Legal (about/contact/partner/privacy/terms), SOP Copilot, Visa Score, Tracker, Document Vault, Financial Planner.
