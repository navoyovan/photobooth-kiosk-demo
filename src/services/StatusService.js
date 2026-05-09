class StatusService {
  constructor() {
    this.interval = null;
    this.status = 'idle'; // idle, session
    this.printer = 'unknown';
    this.camera = 'unknown';

    // Emulation overrides
    this.mockPrinter = null; // 'ready' or 'error'
    this.mockCamera = null;  // 'ready' or 'error'
  }

  async start(uuid) {
    if (!uuid) return;
    this.uuid = uuid;
    
    // Initial check - MUST await so we don't send 'unknown' in the first beat
    await this.checkHardware();
    this.sendHeartbeat();

    // Loop
    this.interval = setInterval(async () => {
      await this.checkHardware();
      this.sendHeartbeat();
    }, 30000); // Every 30 seconds
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
  }

  setStatus(newStatus) {
    this.status = newStatus;
    this.sendHeartbeat(); // Send immediately on status change
  }

  togglePrinterMock() {
    const current = this.mockPrinter || this.printer;
    this.mockPrinter = current === 'ready' ? 'error' : 'ready';
    this.checkHardware();
    this.sendHeartbeat();
  }

  toggleCameraMock() {
    const current = this.mockCamera || this.camera;
    this.mockCamera = current === 'ready' ? 'error' : 'ready';
    this.checkHardware();
    this.sendHeartbeat();
  }

  async checkHardware() {
    if (this.mockCamera) {
      this.camera = this.mockCamera;
    } else {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(d => d.kind === 'videoinput');
        this.camera = hasCamera ? 'ready' : 'error';
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

  async sendHeartbeat() {
    if (!this.uuid) return;
    try {
      const backendUrl = localStorage.getItem('kiosk_backend_url') || 'http://localhost:8000';
      await fetch(`${backendUrl}/api/kiosk/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          uuid: this.uuid,
          status: this.status,
          printer: this.printer,
          camera: this.camera
        })
      });
    } catch (e) {
      console.error('Heartbeat failed', e);
    }
  }
}

export default new StatusService();
