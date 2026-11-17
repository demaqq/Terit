// POS Hardware & Barcode / Thermal Printer Utilities

export interface ThermalPrinterConnection {
  printReceipt: (receiptText: string) => Promise<boolean>;
  isConnected: boolean;
}

export const escapeHtml = (unsafe: string): string =>
  unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const printHtmlDocument = (html: string): boolean => {
  if (typeof document === 'undefined') return false;
  try {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);

    const frameDoc = iframe.contentDocument || iframe.contentWindow?.document;
    const frameWin = iframe.contentWindow;
    if (!frameDoc || !frameWin) {
      document.body.removeChild(iframe);
      return false;
    }

    frameDoc.open();
    frameDoc.write(html);
    frameDoc.close();

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 500);
    };

    setTimeout(() => {
      try {
        frameWin.focus();
        frameWin.print();
      } finally {
        cleanup();
      }
    }, 150);

    return true;
  } catch (e) {
    console.error('Iframe print error:', e);
    return false;
  }
};

export class WebSerialPrinter implements ThermalPrinterConnection {
  private port: any = null;
  public isConnected = false;

  async connect(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !('serial' in navigator)) {
      console.warn('Web Serial API not supported in this browser.');
      return false;
    }
    try {
      this.port = await (navigator as any).serial.requestPort();
      await this.port.open({ baudRate: 9600 });
      this.isConnected = true;
      return true;
    } catch (e) {
      console.error('Serial connection failed:', e);
      return false;
    }
  }

  async printReceipt(receiptText: string): Promise<boolean> {
    if (!this.isConnected || !this.port) {
      const connected = await this.connect();
      if (!connected) return false;
    }
    try {
      const writer = this.port.writable.getWriter();
      const encoder = new TextEncoder();
      const initCommand = new Uint8Array([0x1b, 0x40]); // ESC @
      const textBytes = encoder.encode(receiptText);
      const cutCommand = new Uint8Array([0x1d, 0x56, 0x41, 0x00]); // GS V A

      await writer.write(initCommand);
      await writer.write(textBytes);
      await writer.write(cutCommand);
      writer.releaseLock();
      return true;
    } catch (e) {
      console.error('Printing failed:', e);
      this.isConnected = false;
      return false;
    }
  }
}

export const printViaWindow = (receiptText: string, storeTitle: string): boolean => {
  const safeTitle = escapeHtml(storeTitle);
  const safeBody = escapeHtml(receiptText);
  return printHtmlDocument(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>ETR Fiscal Receipt - ${safeTitle}</title>
        <style>
          body { font-family: monospace; font-size: 12px; padding: 16px; width: 300px; margin: 0 auto; color: #000; background: #fff; }
          pre { white-space: pre-wrap; font-family: monospace; margin: 0; }
        </style>
      </head>
      <body>
        <pre>${safeBody}</pre>
      </body>
    </html>
  `);
};

export class BarcodeScannerListener {
  private buffer = '';
  private lastTime = 0;
  private callback: (barcode: string) => void;
  private boundHandler: (e: KeyboardEvent) => void;

  constructor(onScan: (barcode: string) => void) {
    this.callback = onScan;
    this.boundHandler = this.handleKeyDown.bind(this);
  }

  start() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.boundHandler);
    }
  }

  stop() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.boundHandler);
    }
  }

  private handleKeyDown(e: KeyboardEvent) {
    const target = e.target as HTMLElement | null;
    if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) && e.key !== 'Enter') {
      return;
    }

    const now = Date.now();
    if (now - this.lastTime > 100) {
      this.buffer = '';
    }
    this.lastTime = now;

    if (e.key === 'Enter') {
      if (this.buffer.length >= 3) {
        this.callback(this.buffer.trim());
      }
      this.buffer = '';
    } else if (e.key.length === 1) {
      this.buffer += e.key;
    }
  }
}
