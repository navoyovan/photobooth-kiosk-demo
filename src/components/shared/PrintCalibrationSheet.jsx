import React from 'react';

export default function PrintCalibrationSheet({ printerName, scale, rotation, machineUUID, style, className, screenMode }) {
  const inner = (
    <div style={{
      width: '4in',
      height: '6in',
      backgroundColor: '#ffffff',
      color: '#000000',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'monospace',
      padding: '0.4in',
      boxSizing: 'border-box',
      border: '6px double #000000',
      textAlign: 'center',
      position: 'relative'
    }}>
      {/* Top-Right Quarter-Protractor centered at top-right corner of sheet */}
      <div style={{ position: 'absolute', top: '-6px', right: '-6px', width: '1.5in', height: '1.5in', overflow: 'hidden' }}>
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
          <circle cx="100" cy="0" r="1.5" fill="#000000" />
          {/* Quadrant Arcs centered at (100, 0) */}
          <path d="M 10 0 A 90 90 0 0 0 100 90" fill="none" stroke="#000000" strokeWidth="0.8" />
          <path d="M 20 0 A 80 80 0 0 0 100 80" fill="none" stroke="#000000" strokeWidth="0.3" strokeDasharray="1,1" />
          <path d="M 30 0 A 70 70 0 0 0 100 70" fill="none" stroke="#000000" strokeWidth="0.4" />
          <path d="M 50 0 A 50 50 0 0 0 100 50" fill="none" stroke="#000000" strokeWidth="0.4" />
          {/* Radial lines */}
          <line x1="100" y1="0" x2="100" y2="95" stroke="#000000" strokeWidth="0.8" />
          <line x1="100" y1="0" x2="91.7" y2="94.6" stroke="#000000" strokeWidth="0.3" strokeDasharray="1,2" />
          <line x1="100" y1="0" x2="83.5" y2="93.6" stroke="#000000" strokeWidth="0.3" />
          <line x1="100" y1="0" x2="75.4" y2="91.8" stroke="#000000" strokeWidth="0.5" />
          <line x1="100" y1="0" x2="67.5" y2="89.3" stroke="#000000" strokeWidth="0.3" />
          <line x1="100" y1="0" x2="59.8" y2="86.1" stroke="#000000" strokeWidth="0.3" strokeDasharray="1,2" />
          <line x1="100" y1="0" x2="52.5" y2="82.3" stroke="#000000" strokeWidth="0.5" />
          <line x1="100" y1="0" x2="45.5" y2="77.8" stroke="#000000" strokeWidth="0.3" />
          <line x1="100" y1="0" x2="38.9" y2="72.8" stroke="#000000" strokeWidth="0.3" />
          <line x1="100" y1="0" x2="32.8" y2="67.2" stroke="#000000" strokeWidth="0.6" />
          <line x1="100" y1="0" x2="27.2" y2="61.1" stroke="#000000" strokeWidth="0.3" />
          <line x1="100" y1="0" x2="17.7" y2="47.5" stroke="#000000" strokeWidth="0.5" />
          <line x1="100" y1="0" x2="10.7" y2="32.5" stroke="#000000" strokeWidth="0.3" />
          <line x1="100" y1="0" x2="8.2" y2="24.6" stroke="#000000" strokeWidth="0.5" />
          <line x1="100" y1="0" x2="6.4" y2="16.5" stroke="#000000" strokeWidth="0.3" />
          <line x1="100" y1="0" x2="5" y2="0" stroke="#000000" strokeWidth="0.8" />
          {/* Degree labels */}
          <text x="97" y="88" fontSize="4.5" fontFamily="monospace" textAnchor="end">0&#xB0;</text>
          <text x="74" y="85" fontSize="4.5" fontFamily="monospace" textAnchor="end">15&#xB0;</text>
          <text x="52" y="77" fontSize="4.5" fontFamily="monospace" textAnchor="end">30&#xB0;</text>
          <text x="34" y="63" fontSize="4.5" fontFamily="monospace" textAnchor="end">45&#xB0;</text>
          <text x="21" y="45" fontSize="4.5" fontFamily="monospace" textAnchor="end">60&#xB0;</text>
          <text x="12" y="24" fontSize="4.5" fontFamily="monospace" textAnchor="end">75&#xB0;</text>
          <text x="9" y="8" fontSize="4.5" fontFamily="monospace" textAnchor="end">90&#xB0;</text>
        </svg>
      </div>

      <h2 style={{ margin: '0 0 5px 0', fontSize: '20px', fontWeight: 400, letterSpacing: '2px' }}>HYPE-BOX</h2>
      <h4 style={{ margin: '0 0 15px 0', fontSize: '10px', letterSpacing: '4px', color: '#666' }}>CALIBRATION SHEET</h4>

      <div style={{
        border: '2px dashed #000000',
        width: '100%',
        height: '2.2in',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '9px',
        gap: '5px',
        padding: '10px',
        boxSizing: 'border-box'
      }}>
        <strong>ALIGNMENT MARKER</strong>
        <div style={{ width: '40px', height: '40px', border: '1px solid #000', borderRadius: '50%', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ width: '100%', height: '1px', backgroundColor: '#000', position: 'absolute' }}></div>
          <div style={{ height: '100%', width: '1px', backgroundColor: '#000', position: 'absolute' }}></div>
        </div>
        <span>4" x 6" PORTRAIT</span>

        <div style={{ display: 'flex', width: '100%', height: '0.2in', border: '1px solid #000000', marginTop: '10px', boxSizing: 'border-box' }}>
          <div style={{ flex: 1, backgroundColor: '#ff0000', height: '100%' }}></div>
          <div style={{ flex: 1, backgroundColor: '#00ff00', height: '100%' }}></div>
          <div style={{ flex: 1, backgroundColor: '#0000ff', height: '100%' }}></div>
          <div style={{ flex: 1, backgroundColor: '#00ffff', height: '100%' }}></div>
          <div style={{ flex: 1, backgroundColor: '#ff00ff', height: '100%' }}></div>
          <div style={{ flex: 1, backgroundColor: '#ffff00', height: '100%' }}></div>
          <div style={{ flex: 1, backgroundColor: '#ffffff', height: '100%' }}></div>
          <div style={{ flex: 1, backgroundColor: '#808080', height: '100%' }}></div>
          <div style={{ flex: 1, backgroundColor: '#000000', height: '100%' }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '5px', color: '#555', marginTop: '1px' }}>
          <span>R</span><span>G</span><span>B</span><span>C</span><span>M</span><span>Y</span><span>W</span><span>18%G</span><span>K</span>
        </div>
      </div>

      <div style={{ fontSize: '7.5px', marginTop: '20px', textAlign: 'left', width: '100%', display: 'flex', flexDirection: 'column', gap: '3px', borderTop: '1px solid #000', paddingTop: '10px' }}>
        <div><strong>PRINTER:</strong> {printerName}</div>
        <div><strong>SCALE:</strong> {scale}%</div>
        <div><strong>ROTATION:</strong> {rotation}&#xB0;</div>
        <div><strong>FINGERPRINT:</strong> {machineUUID}</div>
        <div><strong>TIMESTAMP:</strong> {new Date().toLocaleString()}</div>
      </div>
    </div>
  );

  // screenMode: render inline (visible) — used by the printer calibration preview
  if (screenMode) {
    return (
      <div className={'cal-sheet-screen' + (className ? ' ' + className : '')} style={style}>
        {inner}
      </div>
    );
  }

  // Default: hidden off-screen, only visible when printing (via @media print)
  return (
    <div
      className={'print-only-container portrait-print' + (className ? ' ' + className : '')}
      style={style}
    >
      {inner}
    </div>
  );
}
