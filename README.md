# CODENAME: HYPE-BOX Kiosk Terminal

The high-fidelity, editorial-style frontend for the HYPE-BOX physical photobooth station. This terminal is designed for a seamless, premium user experience, blending brutalist typography with cinematic motion.

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root:
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_KIOSK_ID=HYPEBOX-DEV-01
```

### 3. Launch Development Server
```bash
npm run dev
```

---

## 🎨 Design & Aesthetic
The kiosk follows an **Editorial Utility** philosophy—blending high-fashion layout principles with industrial hardware aesthetics.

- **Brutalist Typography**: Driven by *Syne Bold* and *Space Grotesk*, aiming for the "Neue Machina" technical look.
- **Cinematic Motion**: Powered by **anime.js** for high-precision, low-latency UI transitions.
- **Glassmorphism**: Extensive use of "Mica" materials with real-time backdrop blurs for a premium tactile feel.
- **Anti-Arcade Palette**: Pitch black, Alabaster white, and surgical strikes of "Calculated Cyan" highlights.

## 🛠 Tech Stack
- **Frontend**: React 19 + Vite 8
- **Animations**: anime.js (Engine) + Custom Transition Utils
- **Styling**: Vanilla CSS (Scoped Modules & Design Tokens)
- **State Management**: React Context & Hooks (State Machine Logic)
- **Backend Communication**: REST (Fetch API) + Laravel Reverb (In-progress)

## 📺 Session Flow
1. **00-Idle**: "Starfield" attractor loop to draw in users.
2. **01-Payment**: Secure QRIS gateway integration with real-time verification.
3. **02-Selection**: Tactical frame and collage blueprint selector.
4. **03-Capture**: High-framerate camera HUD with telemetry data and real-time filters.
5. **04-Checkout**: Final review, print manifest configuration, and session manifest.
6. **05-Export**: Cinematic processing and digital delivery sequence.
7. **06-Outro**: Closing sequence and session reset.

## ⌨️ Developer Commands & Telemetry
The kiosk includes a built-in Telemetry HUD for debugging and hardware testing.

- **Toggle Dev Mode**: Press `P` to activate the Telemetry HUD.
- **Skip Logic**: Use the `SKIP` and `PREV` buttons to navigate the state machine without completing steps.
- **Bypass Payment**: In Dev Mode, use the `AUTHORIZE` button during checkout to simulate a successful QRIS transaction.
- **Free Flow**: Toggle `FREE_FLOW` to bypass hardware constraints (camera checks, timeouts).
- **Antigravity AI**: Use Antigravity to quickly prototype UI components, debug state machines, or optimize scoped CSS styles.

## 📡 Backend Integration
This kiosk is designed to communicate with the [HYPE-BOX Cloud Payment Backend](file:///c:/laragon/www/photobooth-api/README.md).
- **Default Port**: `8000`
- **Key Services**: Midtrans QRIS generation, Laravel Reverb WebSocket status updates.

## 🏗 Hardware Requirements
- **Display**: 1080x1920 (9:16 Portrait) is the target orientation.
- **Camera**: 1080p WebCam or DSLR via Capture Card.
- **Architecture**: Optimized for Intel NUC / Mac Mini kiosk deployments.

---

*HYPE-BOX is a proprietary photobooth infrastructure. Unauthorized distribution of the "Editorial Utility" design system is prohibited.*
