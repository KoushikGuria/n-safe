import React from 'react';
import { Phone } from 'lucide-react';

// Fixed contact number for all QR profiles
const FIXED_CONTACT_NUMBER = '+913365218303';

export default function ContactButtons({ phone, userName = 'the owner' }) {
  if (!phone) return null;

  const telUri = `tel:${FIXED_CONTACT_NUMBER}`;

  return (
    <div className="contact-actions-container single-action">
      <a
        href={telUri}
        className="contact-btn-single-call"
        title={`Call ${userName}`}
      >
        <Phone size={22} className="call-icon-pulse" />
        <span className="call-btn-text">Call Now</span>
      </a>
    </div>
  );
}

