import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Shield, Globe, Loader2, ChevronRight, AlertTriangle, ShieldCheck, ListPlus, Upload, X as XIcon } from 'lucide-react';
import StatusModal from './StatusModal';
import { API_BASE, TURNSTILE_SITE_KEY } from '../config';

const MAX_BULK_URLS = 50;

export default function PublicForm() {
  const [mode, setMode] = useState('single'); // 'single' | 'bulk'
  const [url, setUrl] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [brand, setBrand] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaError, setCaptchaError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const fileInputRef = useRef(null);

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

  // Splits pasted/uploaded text into a clean list of unique URL-looking lines.
  // Accepts one URL per line; also tolerates commas/semicolons as separators
  // since some exported "list" files use those instead of newlines.
  const parseBulkUrls = (text) => {
    return [...new Set(
      text
        .split(/[\n,;]+/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
    )].slice(0, MAX_BULK_URLS);
  };

  const bulkUrls = parseBulkUrls(bulkText);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      setNotification({ type: 'error', message: 'File too large (max 1MB).' });
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result || '';
      // Merge with anything already typed rather than overwriting it.
      setBulkText((prev) => (prev.trim() ? `${prev.trim()}\n${text}` : text));
    };
    reader.onerror = () => {
      setNotification({ type: 'error', message: 'Could not read that file.' });
    };
    reader.readAsText(file);
    e.target.value = ''; // allow re-uploading the same file name later
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === 'bulk') {
      if (bulkUrls.length === 0 || !brand) return;
      if (!captchaToken) {
        setNotification({ type: 'error', message: 'Please complete the verification box to continue.' });
        return;
      }

      setIsSubmitting(true);
      setNotification(null);

      try {
        const response = await fetch(`${API_BASE}/api/reports/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls: bulkUrls, target_brand_raw: brand, captcha_token: captchaToken })
        });

        const result = await response.json();

        if (response.ok) {
          setNotification({ type: 'success', message: result.message });
          setBulkText('');
          setBrand('');
          resetCaptcha();
        } else {
          setNotification({ type: 'error', message: result.message || 'Bulk submission failed.' });
          resetCaptcha();
        }
      } catch (err) {
        setNotification({ type: 'error', message: 'Connection to server failed. Please try again.' });
        resetCaptcha();
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

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
          {/* Single / Bulk mode toggle */}
          <div className="form-group">
            <div className="mode-toggle-group flex gap-2 mb-1">
              <button
                type="button"
                onClick={() => setMode('single')}
                className={`mode-toggle-btn flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg border transition-colors ${
                  mode === 'single'
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'bg-transparent border-white/5 text-gray-400 hover:text-gray-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                Single URL
              </button>
              <button
                type="button"
                onClick={() => setMode('bulk')}
                className={`mode-toggle-btn flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg border transition-colors ${
                  mode === 'bulk'
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'bg-transparent border-white/5 text-gray-400 hover:text-gray-200'
                }`}
              >
                <ListPlus className="w-3.5 h-3.5" />
                Bulk / File
              </button>
            </div>
          </div>

          {mode === 'single' ? (
            /* Suspicious URL Input */
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
          ) : (
            /* Bulk URL textarea + file upload */
            <div className="form-group">
              <label className="form-label">
                Suspicious URLs (one per line, max {MAX_BULK_URLS})
              </label>
              <textarea
                required
                rows={6}
                placeholder={'https://scam-site-1.com/login\nhttps://scam-site-2.com/login\nhttps://scam-site-3.com/login'}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                className="input-field w-full font-mono text-xs resize-y"
                style={{ paddingLeft: '14px' }}
              />
              <div className="flex items-center justify-between mt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload .txt / .csv file
                </button>
                <span className="text-[11px] text-gray-500">
                  {bulkUrls.length} URL{bulkUrls.length === 1 ? '' : 's'} detected
                </span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.csv,text/plain,text/csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              {bulkText && (
                <button
                  type="button"
                  onClick={() => setBulkText('')}
                  className="mt-1.5 flex items-center gap-1 text-[11px] text-gray-500 hover:text-rose-400 transition-colors"
                >
                  <XIcon className="w-3 h-3" />
                  Clear list
                </button>
              )}
            </div>
          )}

          {/* Victim Brand Standard Input */}
          <div className="form-group">
            <label className="form-label">
              Victim Brand Name {mode === 'bulk' && <span className="text-gray-500 font-normal">(applies to all URLs above)</span>}
            </label>
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
            disabled={isSubmitting || !captchaToken || (mode === 'bulk' && bulkUrls.length === 0)}
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
                <span>{mode === 'bulk' ? `Submit ${bulkUrls.length || ''} Threat Report${bulkUrls.length === 1 ? '' : 's'}` : 'Submit Threat Report'}</span>
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
