# Photobooth Kiosk: Design System & Interface Specification

This document outlines the "Editorial Utility" aesthetic implemented for the Photobooth Kiosk, blending high-fashion editorial layout principles with industrial/mechanical utility.

## Core Design Philosophy: The HYPE-BOX Manifesto

### 1. Typography as Architecture
Text is not merely for reading; it is the physical foundation of the interface.
- **Super-Massive Scale:** Use of *Syne Bold* in giant sizes as visual anchors (e.g., Timer digits, "PAYMENT" hero titles).
- **Ghost Watermarks:** Massive desaturated or transparent logos/text (QRIS logo, "CAPTURE" outlines) that cut through the background for an avant-garde poster feel.
- **Typographic Tension:** Intentional overlap of typography with color blocks using `mix-blend-mode` (multiply/difference) to create a premium screen-printed effect.

### 2. The "Anti-Arcade" Palette
Eliminating intimidating "neon" or "emergency" styles in favor of optical precision.
- **Extreme Minimalism:** Dominance of pitch black (Viewfinder) or Alabaster/Glassmorphism (Payment/Idle).
- **Calculated Cyan:** Cyan is never used for rigid framing; it is injected surgically as a precision highlight (micro-indicators, scanner lines, partial overlaps).

### 3. Cinematic & Mechanical Feel
The interface should feel like high-end professional hardware (Leica/ARRI), not a standard touch app.
- **Leica/ARRI Viewfinder:** Clean feed with hairline crosshairs, micro-telemetry (`ISO_3200 // F1.4`), and strict flush-left/flush-right alignment.
- **Tactile Interactions:** UI controls mimic mechanical instruments—timers as analog dials and pagination as vertical odometers with precise braking.

### 4. Elegant "Invisible Affordance" (Fat-Finger UX)
Accessibility is hidden within aesthetics rather than using "ugly" giant buttons.
- **Global Hitboxes:** "Tap Anywhere" for capture.
- **Aesthetic Scale:** Numbers and menu items (FRAME, COLLAGE) are scaled up to ensure large touch targets while maintaining a clean, negative-space-heavy layout.

---

## Design Tokens
| Token | Hex/Value | Usage |
| :--- | :--- | :--- |
| **Alabaster** | `#F4F2EF` | Primary Background (Soft Ivory) |
| **Charcoal** | `#151515` | Primary Text & Borders |
| **Cyan (Accent)** | `#32FFE7` | High-contrast highlights, active states |
| **Glass** | `rgba(247, 247, 246, 0.85)` | Blur panels (24px backdrop-filter) |
| **Pillar** | `opacity: 0.04` | Large background watermarks |

### 2. Typography
| Font Family | Style | Role |
| :--- | :--- | :--- |
| **PP Syne** | 800/900 | Main Display, Hero Titles, Mechanical Labels |
| **Space Grotesk** | 300/400/700 | Utility Text, Instructions, Telemetry, Numbers |
| **Cormorant Garamond** | Italic | Contrast/Poetic elements (Cancel, Secondary actions) |

---

## Page 2: Initial Payment
**Objective:** Create a secure, high-end transaction interface.

### Layout: 35/65 Split
- **Left Panel (Instructional):**
    - **Watermark:** Vertical "SECURE" pillar (22vw).
    - **Hero Title:** "PAYMENT" (6rem Syne) with a Cyan "▌" indicator overlapping using `multiply` blend mode.
    - **Instructions:** Numbered list (01-03) in Space Grotesk (0.85rem).
    - **Promo System:** Minimalist underlined input. Tapping opens a **Brutalist Numpad** (3-column grid, heavy 2px borders, solid shadow).
- **Right Panel (Transactional):**
    - **QR Monument:** 450px dashed container with decorative L-shaped heavy corners.
    - **Ghost Watermark:** Desaturated QRIS logo background.
    - **Price Monument:** Massive price display (6rem) centered below the QR.
    - **Timer:** Pulsing countdown in monospace (Space Grotesk).
    - **Metadata:** "MID: HYPX-00293" string at the bottom to reinforce the "Utility" feel.

---

## Page 3: Frame Select
**Objective:** Provide a tactile, "infinite" gallery experience.

### Layout: 35/65 Split
- **Left Panel (Navigation):**
    - **Watermark:** Vertical "SELECT YOUR CANVAS" pillar.
    - **Kinetic Toggle:** Large vertical options for "FRAME" and "COLLAGE" using an **Odometer-style** vertical scroll. 
    - **Interaction:** Active state is signaled by the Cyan "▌" block. Inactive states pulse subtly.
- **Right Panel (The Vault):**
    - **Alternating Scroll Grid:** 4 columns of frame thumbnails moving vertically at different speeds.
    - **Inertia Scrolling:** Smooth parallax effect when dragging or flicking.
- **Selection State:**
    - **Glass Backdrop:** Selecting a frame triggers a full-screen blur.
    - **Preview:** The selected frame is isolated in the center.
    - **Confirm Button:** Brutalist block button (`box-shadow: 8px 8px 0px #000`) with a "●" dot indicator.

---

## Page 4: Viewfinder & Compositing
**Objective:** Professional camera HUD followed by a precision curation tool.

### 4.1 Viewfinder HUD (Live Feed)
- **Aesthetic:** High-end hardware feed (Leica/ARRI style).
- **Optical Grid:** Thin horizontal/vertical lines with a center crosshair.
- **Ghost Watermark:** Massive "CAPTURE" text in the background.
- **Telemetry (Top-Left):** Micro-telemetry data (e.g., `ISO_3200 // F1.4 // S_1/125`).
- **Timer Axis (Center-Left):** A vertical sliding "Analog Dial" selector for 0s, 3s, and 5s delay.
- **Camera Selector (Bottom-Left):** Brutalist toggles for "DSLR" vs "WEBCAM".
- **Invisible Affordance:** "TAP ANYWHERE TO CAPTURE" global hitbox.

### 4.2 Compositing Panel (Post-Capture)
- **Layout:** Reverts to the 35/65 editorial split.
- **Left Panel (Curate):**
    - **Filter Grid:** 3-column brutalist grid for "LENS_STYLE" (RAW, MONO, NOIR, etc.).
    - **Transform:** Minimalist switch for "MIRROR_SESSION".
- **Right Panel (Render):**
    - **Interactive Canvas:** Floating photo preview with the selected frame overlay.
    - **Status Greebles:** Metadata like `RENDER_SIZE: 14.2MB` and a running system timestamp.
    - **Print Pill:** Large centered button: `[ PRINT COMPOSITION ]`.
