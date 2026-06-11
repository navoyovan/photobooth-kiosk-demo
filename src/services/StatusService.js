

class StatusService {
  constructor() {
    this.timeoutId = null;
    this.status = 'idle'; // idle, session
    this.printer = 'unknown';
    this.camera = 'unknown';

    // Emulation overrides
    this.mockPrinter = null; // 'ready' or 'error'
    this.mockCamera = null;  // 'ready' or 'error'
    this.isLocalBackend = false; // Auto-detected local API link
  }


  async start(uuid) {
    if (!uuid) return;
    this.uuid = uuid;
    
    // Initial check - MUST await so we don't send 'unknown' in the first beat
    await this.checkHardware();
    this.sendHeartbeat();

    // Start loop
    this.scheduleNext();
  }

  scheduleNext() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    // "live" (30 seconds) if in a session or if printer is disconnected/error
    // otherwise 10 minutes (600,000 ms)
    const isLive = this.status === 'session' || this.printer !== 'ready';
    const delay = isLive ? 30000 : 600000;

    this.timeoutId = setTimeout(async () => {
      await this.checkHardware();
      await this.sendHeartbeat();
      this.scheduleNext();
    }, delay);
  }

  stop() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  setStatus(newStatus) {
    const statusChanged = this.status !== newStatus;
    this.status = newStatus;
    
    if (statusChanged) {
      // Force immediate check and heartbeat send, then reschedule
      (async () => {
        await this.checkHardware();
        await this.sendHeartbeat();
        this.scheduleNext();
      })();
    } else {
      this.sendHeartbeat();
    }
  }

  togglePrinterMock() {
    const current = this.mockPrinter || this.printer;
    this.mockPrinter = current === 'ready' ? 'error' : 'ready';
    (async () => {
      await this.checkHardware();
      await this.sendHeartbeat();
      this.scheduleNext();
    })();
  }

  toggleCameraMock() {
    const current = this.mockCamera || this.camera;
    this.mockCamera = current === 'ready' ? 'error' : 'ready';
    (async () => {
      await this.checkHardware();
      await this.sendHeartbeat();
      this.scheduleNext();
    })();
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
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 800); // Strict 800ms threshold
        
        const localBackend = localStorage.getItem('PHOTOBOOTH_BACKEND_URL') || 'http://localhost:8000';
        const printerName = localStorage.getItem('PHOTOBOOTH_PRINTER_NAME') || 'Epson SL-D500';
        
        const response = await fetch(`${localBackend}/api/kiosk/printer/status?name=${encodeURIComponent(printerName)}`, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          this.isLocalBackend = true;
          this.printer = data.status === 'ready' ? 'ready' : 'error';
        } else {
          this.isLocalBackend = false;
          this.printer = 'ready'; // fallback to blind ready
        }
      } catch (e) {
        // Offline / timed out -> graceful fallback to blind ready
        this.isLocalBackend = false;
        this.printer = 'ready';
      }
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
