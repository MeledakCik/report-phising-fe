import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Shield, Globe, Loader2, ChevronRight, AlertTriangle, ShieldCheck } from 'lucide-react';
import StatusModal from './StatusModal';
import { API_BASE, TURNSTILE_SITE_KEY } from '../config';

export default function PublicForm() {
  const [url, setUrl] = useState('');
  const [brand, setBrand] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaError, setCaptchaError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  // Deduplication Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);

  // Real Cloudflare Turnstile widget
  const turnstileContainerRef = useRef(null);
  const widgetIdRef = useRef(null);

  const renderTurnstile = useCallback(() => {
    if (!window.turnstile || !turnstileContainerRef.current || widgetIdRef.current) return;
    if (!TURNSTILE_SITE_KEY) return;

    widgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      theme: 'dark',
      callback: (token) => {
        setCaptchaToken(token);
        setCaptchaError(false);
      },
      'expired-callback': () => setCaptchaToken(''),
      'error-callback': () => {
        setCaptchaToken('');
        setCaptchaError(true);
      }
    });
  }, []);

  useEffect(() => {
    // The Turnstile script tag in index.html loads async; poll briefly until it's ready.
    if (window.turnstile) {
      renderTurnstile();
      return;
    }
    const interval = setInterval(() => {
      if (window.turnstile) {
        clearInterval(interval);
        renderTurnstile();
      }
    }, 200);
    return () => clearInterval(interval);
  }, [renderTurnstile]);

  const resetCaptcha = () => {
    setCaptchaToken('');
    if (window.turnstile && widgetIdRef.current) {
      window.turnstile.reset(widgetIdRef.current);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url || !brand) return;
    if (!captchaToken) {
      setNotification({ type: 'error', message: 'Please complete the verification box to continue.' });
      return;
    }

    setIsSubmitting(true);
    setNotification(null);

    try {
      const response = await fetch(`${API_BASE}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reported_url: url, target_brand_raw: brand, captcha_token: captchaToken })
      });

      const result = await response.json();

      if (response.status === 201 || response.ok) {
        if (result.is_duplicate) {
          setModalData(result.data);
          setIsModalOpen(true);
          setUrl('');
          setBrand('');
          resetCaptcha();
        } else {
          setNotification({ type: 'success', message: 'Threat report successfully submitted for forensic evaluation.' });
          setUrl('');
          setBrand('');
          resetCaptcha();
        }
      } else {
        setNotification({ type: 'error', message: result.message || 'Threat submission failed.' });
        resetCaptcha();
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Connection to server failed. Please try again.' });
      resetCaptcha();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="public-form-container">
      <div className="centered-card">
        <h2 className="card-title">Report Suspicious URL</h2>

        <form onSubmit={handleSubmit}>
          {/* Suspicious URL Input */}
          <div className="form-group">
            <label className="form-label">Suspicious URL</label>
            <div className="input-container">
              <Globe className="input-icon-prefix w-4 h-4" />
              <input
                type="url"
                required
                placeholder="https://scam-site-url.com/login"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="input-field has-prefix"
              />
            </div>
          </div>

          {/* Victim Brand Standard Input */}
          <div className="form-group">
            <label className="form-label">Victim Brand Name</label>
            <div className="input-container">
              <Shield className="input-icon-prefix w-4 h-4" />
              <input
                type="text"
                required
                placeholder="Victim Brand Name"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="input-field has-prefix"
              />
            </div>
          </div>

          {/* CAPTCHA Turnstile Verification (real Cloudflare Turnstile widget) */}
          <div className="form-group">
            <label className="form-label">Security Verification</label>
            {TURNSTILE_SITE_KEY ? (
              <div ref={turnstileContainerRef} className="turnstile-widget-container" />
            ) : (
              <div className="form-notification error">
                <AlertTriangle className="notification-icon w-4 h-4" />
                <span>Verification widget is not configured (missing site key).</span>
              </div>
            )}
            {captchaError && (
              <div className="form-notification error">
                <AlertTriangle className="notification-icon w-4 h-4" />
                <span>Verification failed to load. Please refresh and try again.</span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !captchaToken}
            className="gradient-submit-btn"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>Submit Threat Report</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Notifications */}
        {notification && (
          <div className={`form-notification ${notification.type}`}>
            {notification.type === 'success' ? (
              <ShieldCheck className="notification-icon w-4 h-4" />
            ) : (
              <AlertTriangle className="notification-icon w-4 h-4" />
            )}
            <span>{notification.message}</span>
          </div>
        )}
      </div>

      {/* Deduplication Warning Modal */}
      <StatusModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        reportData={modalData}
      />
    </div>
  );
}
