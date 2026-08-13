import React, { useState } from 'react';
import { Shield, Globe, Check, Loader2, ChevronRight, AlertTriangle, ShieldCheck } from 'lucide-react';
import StatusModal from './StatusModal';
import { API_BASE } from '../config';

export default function PublicForm() {
  const [url, setUrl] = useState('');
  const [brand, setBrand] = useState('');
  const [captchaChecked, setCaptchaChecked] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // Deduplication Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);

  const handleCaptchaClick = () => {
    if (captchaChecked) {
      setCaptchaChecked(false);
      return;
    }
    setCaptchaLoading(true);
    setTimeout(() => {
      setCaptchaLoading(false);
      setCaptchaChecked(true);
    }, 850);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url || !brand) return;
    if (!captchaChecked) {
      setNotification({ type: 'error', message: 'Please check the verification box to continue.' });
      return;
    }

    setIsSubmitting(true);
    setNotification(null);

    try {
      const response = await fetch(`${API_BASE}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reported_url: url, target_brand_raw: brand })
      });

      const result = await response.json();

      if (response.status === 201 || response.ok) {
        if (result.is_duplicate) {
          setModalData(result.data);
          setIsModalOpen(true);
          setUrl('');
          setBrand('');
          setCaptchaChecked(false);
        } else {
          setNotification({ type: 'success', message: 'Threat report successfully submitted for forensic evaluation.' });
          setUrl('');
          setBrand('');
          setCaptchaChecked(false);
        }
      } else {
        setNotification({ type: 'error', message: result.message || 'Threat submission failed.' });
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Connection to server failed. Please try again.' });
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

          {/* CAPTCHA Turnstile Verification */}
          <div className="form-group">
            <label className="form-label">Security Verification</label>
            <div className="turnstile-widget">
              <div className="turnstile-left">
                <button
                  type="button"
                  onClick={handleCaptchaClick}
                  disabled={captchaLoading || isSubmitting}
                  className={`turnstile-checkbox-btn ${captchaChecked ? 'checked' : ''}`}
                >
                  {captchaLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  ) : captchaChecked ? (
                    <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                  ) : null}
                </button>
                <span className="turnstile-label">Verify you are human</span>
              </div>
              
              <div className="turnstile-logo-container">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 18C10.9 18 10 17.1 10 16C10 14.9 10.9 14 12 14C13.1 14 14 14.9 14 16C14 17.1 13.1 18 12 18ZM15.2 11.2L12.7 13.7C12.4 14 12.2 14.5 12.2 15H11.8V13.5C11.8 13 12 12.5 12.3 12.2L13.8 10.7C14.1 10.4 14.2 10 14.2 9.6C14.2 8.7 13.5 8 12.6 8C11.7 8 11 8.7 11 9.6H9C9 7.6 10.6 6 12.6 6C14.6 6 16.2 7.6 16.2 9.6C16.1 10.2 15.8 10.8 15.2 11.2Z" fill="#e5e7eb" opacity="0.3"/>
                </svg>
                <span className="turnstile-logo-text">Turnstile</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !captchaChecked}
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
