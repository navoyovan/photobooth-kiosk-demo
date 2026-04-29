# CODENAME: HYPE-BOX Kiosk Terminal

The high-fidelity, editorial-style frontend for the HYPE-BOX physical photobooth station. Built with a focus on premium aesthetics, brutalist typography, and ultra-smooth GSAP animations.

## UI/UX Philosophy
- **Editorial Utility**: A blend of minimalist museum aesthetics and high-contrast camera HUDs.
- **Kinetic Feedback**: Every transition is managed via GSAP to ensure visual continuity and physical presence.
- **Typography**: Heavily utilizes *Syne* and *Space Grotesk* for a mechanical yet sophisticated feel.

## Tech Stack
- **Framework**: React 18 + Vite
- **Animations**: GSAP (GreenSock Animation Platform)
- **Styling**: Vanilla CSS (Tailored Design System)
- **Communication**: Fetch API (REST) + WebSockets (In-progress)

## Key Screens
1. **00-Idle**: The "Starfield" attractor loop.
2. **01-Payment**: Secure QRIS gateway integration with mock testing support.
3. **02-Selection**: Frame and collage blueprint selector.
4. **03-Capture**: High-framerate viewfinder with real-time filters.
5. **04-Checkout**: Final review and print manifest configuration.
6. **05-Export**: Cinematic processing and digital delivery.

## Developer Controls
- **Toggle Dev Mode**: Press `p` on your keyboard to toggle the Telemetry HUD and skip-buttons.
- **Mock Payment**: On the Payment screen, use the hidden `[DEV] Websocket` button (bottom-left) to simulate a successful transaction.

## Installation & Setup

### 1. Clone & Install
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file in the root (refer to `.env.example` if available):
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_KIOSK_ID=HYPEBOX-DEV-01
```

### 3. Run Development Server
```bash
npm run dev
```

## Hardware Requirements
- **Camera**: 1080p WebCam or DSLR via Capture Card (Ideal: 1920x1080).
- **Display**: Vertical 1080x1920 (Portait) / Standard Landscape 1920x1080 support.
- **Input**: Touchscreen or Mouse/Keyboard for debugging.
