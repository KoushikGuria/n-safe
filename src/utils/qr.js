/**
 * Generates a unique, non-sensitive QR identifier.
 * Example output: "u_a9f3b28d0e"
 */
export function generateQrId() {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  let randomStr = '';
  // Generate 10 cryptographically random or pseudorandom characters
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(10);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < 10; i++) {
      randomStr += chars[bytes[i] % chars.length];
    }
  } else {
    for (let i = 0; i < 10; i++) {
      randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return `u_${randomStr}`;
}

/**
 * Builds the public contact URL for a given qrId.
 */
export function getPublicQrUrl(qrId) {
  if (!qrId) return '';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/u/${qrId}`;
}

/**
 * Downloads a canvas element as a PNG file.
 * Optionally wraps the QR in a polished frame with the user's name and scan prompt.
 */
export function downloadQrImage(canvasElement, filename = 'my-qr-code.png', title = 'Scan to Contact Me') {
  if (!canvasElement) return;

  // Create a high-res offscreen canvas with nice padding and label
  const padding = 32;
  const headerHeight = title ? 48 : 0;
  const footerHeight = 40;
  
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = canvasElement.width + padding * 2;
  exportCanvas.height = canvasElement.height + padding * 2 + headerHeight + footerHeight;
  
  const ctx = exportCanvas.getContext('2d');
  if (!ctx) {
    // Fallback directly to original canvas
    const url = canvasElement.toDataURL('image/png');
    triggerDownload(url, filename);
    return;
  }

  // Draw white background
  ctx.fillStyle = '#FFFFFF';
  ctx.roundRect 
    ? ctx.roundRect(0, 0, exportCanvas.width, exportCanvas.height, 16)
    : ctx.rect(0, 0, exportCanvas.width, exportCanvas.height);
  ctx.fill();

  // Subtle border
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw Title
  if (title) {
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 20px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, exportCanvas.width / 2, padding + 22);
  }

  // Draw the QR Code
  const qrY = padding + headerHeight;
  ctx.drawImage(canvasElement, padding, qrY);

  // Draw Footer
  ctx.fillStyle = '#64748B';
  ctx.font = '500 14px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Scan with camera or QR reader', exportCanvas.width / 2, exportCanvas.height - padding + 12);

  const finalUrl = exportCanvas.toDataURL('image/png');
  triggerDownload(finalUrl, filename);
}

function triggerDownload(dataUrl, filename) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
