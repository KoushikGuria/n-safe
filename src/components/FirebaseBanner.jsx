import React, { useState } from 'react';
import { isFirebaseConfigured } from '../firebase/config';
import { Info, X, ExternalLink, Key } from 'lucide-react';

export default function FirebaseBanner() {
  const [dismissed, setDismissed] = useState(false);

  // If real Firebase is already configured or banner was closed, don't show
  if (isFirebaseConfigured || dismissed) {
    return null;
  }

  return (
    <aside className="firebase-status-banner no-print" aria-label="Development status banner">
      <div className="banner-inner">
        <div className="banner-left">
          <span className="banner-badge">
            <Key size={13} />
            <span>Dev / Demo Mode Active</span>
          </span>
          <p className="banner-message">
            Firebase keys not detected in <code>.env</code>. Running in high-fidelity local state mode so you can test all features (Register, QR, Messages, Calling) immediately! Add your Firebase credentials to <code>.env</code> when ready for production.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="btn-banner-close"
          aria-label="Dismiss banner"
        >
          <X size={16} />
        </button>
      </div>
    </aside>
  );
}
