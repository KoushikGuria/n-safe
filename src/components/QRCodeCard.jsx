import React, { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Printer, Copy, Check, ExternalLink, Sparkles } from 'lucide-react';
import { getPublicQrUrl, downloadQrImage } from '../utils/qr';
import logoImg from '../assets/logo.png';

export default function QRCodeCard({ userProfile }) {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef(null);
  const printAreaRef = useRef(null);

  const qrId = userProfile?.qrId || '';
  const userName = userProfile?.name || 'User';
  const publicUrl = getPublicQrUrl(qrId);

  const handleCopyLink = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleDownload = () => {
    const canvas = cardRef.current?.querySelector('canvas');
    if (canvas) {
      downloadQrImage(canvas, 'my-qr-code.png', `Contact ${userName}`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Normal Interactive UI Card */}
      <div className="qr-card no-print" ref={cardRef}>
        <div className="qr-card-header">
          <div className="qr-badge">
            <Sparkles size={14} />
            <span>Active QR Identifier</span>
          </div>
          <h2 className="qr-card-title">Your QR Code</h2>
          <p className="qr-card-subtitle">
            Anyone scanning this code can send you direct messages, chat on WhatsApp, or call you.
          </p>
        </div>

        {/* QR Code Canvas Frame */}
        <div className="qr-canvas-wrapper">
          <div className="qr-frame">
            {publicUrl ? (
              <QRCodeCanvas
                value={publicUrl}
                size={230}
                level="H"
                includeMargin={true}
                bgColor="#FFFFFF"
                fgColor="#0F172A"
                imageSettings={{
                  src: logoImg,
                  height: 34,
                  width: 34,
                  excavate: true,
                }}
              />
            ) : (
              <div className="qr-placeholder">Generating code...</div>
            )}
          </div>
        </div>

        {/* Public URL Box with Copy */}
        <div className="qr-url-box">
          <div className="qr-url-text" title={publicUrl}>
            {publicUrl}
          </div>
          <button
            type="button"
            onClick={handleCopyLink}
            className={`btn-copy ${copied ? 'copied' : ''}`}
            title="Copy public link to clipboard"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>

        {/* Action Buttons: Download & Print */}
        <div className="qr-actions-grid">
          <button
            type="button"
            onClick={handleDownload}
            className="btn-action btn-download"
          >
            <Download size={18} />
            <span>Download QR</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="btn-action btn-print"
          >
            <Printer size={18} />
            <span>Print QR</span>
          </button>
        </div>

        <div className="qr-card-footer">
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="preview-link"
          >
            <span>Test preview as a visitor</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* Dedicated Clean Printable Sheet (Visible only when window.print() is executed) */}
      <div className="print-only-container" ref={printAreaRef}>
        <div className="print-sheet">
          <div className="print-header">
            <h1 className="print-title">{userName}</h1>
            <p className="print-tagline">Direct Contact & Instant Messaging</p>
          </div>

          <div className="print-qr-box">
            {publicUrl && (
              <QRCodeCanvas
                value={publicUrl}
                size={280}
                level="H"
                includeMargin={true}
                bgColor="#FFFFFF"
                fgColor="#000000"
                imageSettings={{
                  src: logoImg,
                  height: 42,
                  width: 42,
                  excavate: true,
                }}
              />
            )}
          </div>

          <div className="print-footer">
            <h2 className="print-prompt">Scan this QR code to contact me</h2>
            <p className="print-subtext">
              Point your smartphone camera at the QR code above to send a direct message, chat via WhatsApp, or make a direct call.
            </p>
            <p className="print-url">{publicUrl}</p>
          </div>
        </div>
      </div>
    </>
  );
}
