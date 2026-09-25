import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { sendPublicMessage, checkRateLimit } from '../services/messageService';

export default function MessageForm({ qrId, userId, recipientName = 'User' }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const MAX_CHARS = 1000;

  // Check rate limit on mount
  useEffect(() => {
    const rate = checkRateLimit(qrId);
    if (!rate.allowed) {
      setCooldown(rate.remainingSec);
    }
  }, [qrId]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmed = message.trim();
    if (!trimmed) {
      setError('Please type a message before sending.');
      return;
    }

    if (trimmed.length > MAX_CHARS) {
      setError(`Message is too long. Maximum allowed is ${MAX_CHARS} characters.`);
      return;
    }

    setLoading(true);

    try {
      await sendPublicMessage(qrId, userId, trimmed);
      setSuccess(true);
      setMessage('');
      setCooldown(15);
    } catch (err) {
      setError(err.message || 'Failed to deliver message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendAnother = () => {
    setSuccess(false);
    setError('');
  };

  if (success) {
    return (
      <div className="message-success-card animate-scale-in">
        <div className="success-icon-badge">
          <CheckCircle2 size={36} className="text-emerald" />
        </div>
        <h3 className="success-title">Message Delivered!</h3>
        <p className="success-text">
          Your message has been safely sent to <strong>{recipientName}</strong>. They will be able to review it in their dashboard.
        </p>
        <button
          type="button"
          onClick={handleSendAnother}
          className="btn-secondary btn-sm mt-3"
          disabled={cooldown > 0}
        >
          {cooldown > 0 ? `Wait ${cooldown}s to send another` : 'Send another message'}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="message-form">
      <div className="form-group">
        <label htmlFor="visitor-message" className="form-label">
          Send a Message
        </label>
        
        <div className="textarea-wrapper">
          <textarea
            id="visitor-message"
            rows={4}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (error) setError('');
            }}
            placeholder={`Enter your message for ${recipientName}...`}
            className={`form-textarea ${error ? 'input-error' : ''}`}
            maxLength={MAX_CHARS}
            disabled={loading || cooldown > 0}
            required
          />
          <div className="textarea-footer">
            <span className="char-count">
              {message.length} / {MAX_CHARS}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert-box alert-error animate-fade-in" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {cooldown > 0 && !error && (
        <div className="alert-box alert-info animate-fade-in">
          <Clock size={18} />
          <span>Cooldown active: Please wait {cooldown}s before sending another message.</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || cooldown > 0 || !message.trim()}
        className="btn-primary btn-block btn-send-message"
      >
        {loading ? (
          <>
            <span className="spinner-sm white"></span>
            <span>Sending message...</span>
          </>
        ) : (
          <>
            <Send size={18} />
            <span>Send Message</span>
          </>
        )}
      </button>
    </form>
  );
}
