class StatusService {
  constructor() {
    this.timeoutId = null;
    this.status = 'idle'; // idle, session
    this.printer = 'ready';
    this.camera = 'unknown';

    // Emulation overrides
    this.mockPrinter = null; // 'ready' or 'error'
    this.mockCamera = null;  // 'ready' or 'error'
    this.isLocalBackend = false;
  }

  async start() {
    await this.checkHardware();
    this.scheduleNext();
  }

  scheduleNext() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    // Local hardware poll every 10 seconds
    this.timeoutId = setTimeout(async () => {
      await this.checkHardware();
      this.scheduleNext();
    }, 10000);
  }

  stop() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  setStatus(newStatus) {
    this.status = newStatus;
  }

  togglePrinterMock() {
    const current = this.mockPrinter || this.printer;
    this.mockPrinter = current === 'ready' ? 'error' : 'ready';
    this.printer = this.mockPrinter;
  }

  toggleCameraMock() {
    const current = this.mockCamera || this.camera;
    this.mockCamera = current === 'ready' ? 'error' : 'ready';
    this.camera = this.mockCamera;
  }

  async checkHardware() {
    if (this.mockCamera) {
      this.camera = this.mockCamera;
    } else {
      try {
        if (navigator?.mediaDevices?.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const hasCamera = devices.some(d => d.kind === 'videoinput');
          this.camera = hasCamera ? 'ready' : 'error';
        } else {
          this.camera = 'ready';
        }
      } catch (e) {
        this.camera = 'error';
      }
    }

    if (this.mockPrinter) {
      this.printer = this.mockPrinter;
    } else {
      this.printer = 'ready';
    }
  }

  sendHeartbeat() {
    // Pure offline demo — zero network requests
  }
}

export default new StatusService();
