# Design System Strategy: The Industrial Connector

## 1. Overview & Creative North Star
**Creative North Star: "The Architectural Ledger"**
This design system rejects the "SaaS template" aesthetic in favor of a high-end editorial approach that mirrors the strength and precision of the industrial sector. It is built to feel like a premium B2B ledger—authoritative, meticulously organized, and structurally sound.

We move beyond standard layouts by using **intentional asymmetry** and **high-contrast scale**. Instead of center-aligned "hero" blocks, we utilize wide-measure typography and "Power Anchors"—placing key actions in unexpected but logically sound positions. The goal is a digital experience that feels "constructed" rather than "rendered," emphasizing the industrial growth and professional networking at the heart of the platform.

---

## 2. Colors
The palette is a sophisticated mix of deep industrial blues (`primary`) and technical greys (`secondary`), providing a foundation of unwavering trust.

*   **Primary Foundation:** Use `primary` (#00213f) for core brand moments and `primary_container` (#10375c) for deep-set UI sections.
*   **The "No-Line" Rule:** Explicitly prohibit the use of 1px solid borders to define sections. Layout boundaries must be created through background shifts. For example, a main content area using `surface` (#f7f9fb) should be separated from a sidebar using `surface_container_low` (#f2f4f6).
*   **Surface Hierarchy & Nesting:** Treat the interface as physical layers. Use `surface_container_lowest` (#ffffff) for the most interactive foreground elements (cards, inputs) and `surface_dim` (#d8dadc) for structural underlays.
*   **The "Glass & Gradient" Rule:** For high-end "floating" navigation or utility panels, use semi-transparent `surface_container_lowest` with a 12px-20px backdrop blur.
*   **Signature Textures:** Main CTAs or Hero backgrounds should utilize subtle linear gradients transitioning from `primary` (#00213f) to `primary_container` (#10375c) at a 135-degree angle to add depth and "soul" to solid surfaces.

---

## 3. Typography
The system employs a dual-typeface strategy to balance industrial strength with corporate clarity.

*   **Display & Headlines (Manrope):** Chosen for its geometric, modern, and "engineered" feel. Use `display-lg` (3.5rem) with tight letter-spacing (-0.02em) for impactful value propositions.
*   **Body & Labels (Inter):** The workhorse for B2B readability. `body-md` (0.875rem) serves as the standard for data-heavy provider lists and company descriptions.
*   **Editorial Scale:** Create a sense of hierarchy by paring extremely large `headline-lg` titles with significantly smaller `label-md` metadata. This high-contrast pairing mimics high-end architectural journals.

---

## 4. Elevation & Depth
We eschew traditional "material" shadows in favor of **Tonal Layering**.

*   **The Layering Principle:** Stack `surface-container` tiers to create lift. A card (`surface_container_lowest`) sitting on a background (`surface_container_low`) provides all the visual cues needed for interactivity without the "noise" of drop shadows.
*   **Ambient Shadows:** Where floating elements are required (e.g., Modals), use a "tinted shadow." Use the `on_surface` color at 6% opacity with a blur of 32px and a Y-offset of 16px. This mimics soft, natural office lighting.
*   **The "Ghost Border" Fallback:** If a container requires further definition, use the `outline_variant` token at **15% opacity**. This creates a "suggestion" of a boundary that remains minimalist and modern.
*   **Glassmorphism:** Use `surface_container_highest` at 70% opacity with a heavy backdrop blur for "floating" action bars.

---

## 5. Components

### Buttons
*   **Primary:** Solid `primary` background with `on_primary` text. Use `DEFAULT` (0.25rem) roundedness for an industrial, "machined" look.
*   **Secondary:** `surface_container_high` background with `on_secondary_container` text. This provides a tactile, "button" feel without competing with the primary action.
*   **Tertiary/Ghost:** No background. Use `primary` text and an icon. Forbid borders.

### Cards & Lists
*   **The "No-Divider" Rule:** Forbid 1px dividers between list items. Use `spacing.8` (2rem) of vertical white space or a subtle shift from `surface` to `surface_container_low` to define list boundaries.
*   **B2B Industrial Cards:** Use `surface_container_lowest` for the card body. Use `title-md` for company names and `label-sm` for industrial sectors.

### Input Fields
*   **Aesthetic:** Large padding (`spacing.4`) and `surface_container_low` backgrounds. 
*   **States:** On focus, transition the background to `surface_container_lowest` and apply a "Ghost Border" using `surface_tint`.

### Data Chips
*   **Technical Style:** Use `secondary_container` with `on_secondary_container` text. These should be rectangular with `sm` (0.125rem) rounding to look like technical labels or industrial tags.

---

## 6. Do's and Don'ts

### Do
*   **DO** use whitespace as a structural element. If an element feels crowded, increase spacing using the `spacing.12` or `spacing.16` tokens.
*   **DO** align text to a strict vertical grid to reinforce the sense of "industrial order."
*   **DO** use `tertiary` (#001b55) for deep-link networking elements or "Connect" actions to distinguish them from standard navigation.

### Don't
*   **DON'T** use 100% black for text. Always use `on_surface` (#191c1e) to maintain a sophisticated, soft-contrast editorial feel.
*   **DON'T** use heavy, rounded corners (`xl` or `full`) for structural B2B components. Stick to `DEFAULT` or `md` to maintain a professional, empresarial edge.
*   **DON'T** use traditional "alert" colors for anything other than critical errors. Use `primary_fixed` or `secondary_fixed` for "success" or "info" states to keep the palette grounded in the industrial blue/grey theme.