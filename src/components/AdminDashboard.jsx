import React, { useState, useEffect } from 'react';
import { ShieldCheck, Mail, ShieldX, Terminal, RefreshCw, ExternalLink, Users, Activity, Eye, Play, Copy, Check, AlertTriangle } from 'lucide-react';
import { API_BASE } from '../config';

export default function AdminDashboard() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [dispatchedMailLog, setDispatchedMailLog] = useState(null);
  const [dispatchedChannels, setDispatchedChannels] = useState(null);
  const [copiedLink, setCopiedLink] = useState(null);

  // Fetch pending reports
  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/reports/pending`);
      const data = await res.json();
      setReports(data);
      if (data.length > 0) {
        // Maintain selection if it's still in the list, otherwise select first item
        const isStillPending = selectedReport && data.some(r => r.id === selectedReport.id);
        if (isStillPending) {
          setSelectedReport(data.find(r => r.id === selectedReport.id));
        } else {
          setSelectedReport(data[0]);
        }
      } else {
        setSelectedReport(null);
      }
    } catch (err) {
      console.error('Failed to load pending reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  // Trigger Janitor checking manually
  const handleRunJanitor = async () => {
    setNotification({ type: 'info', message: 'Running Janitor checks...' });
    try {
      const res = await fetch(`${API_BASE}/api/janitor/run`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: 'Janitor checks finished.' });
        fetchPending();
      } else {
        setNotification({ type: 'error', message: data.message });
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to run Janitor checks.' });
    }
  };

  // Approve report (takedown request)
  const handleApprove = async (id) => {
    setActionLoading(true);
    setNotification(null);
    setDispatchedMailLog(null);
    setDispatchedChannels(null);
    try {
      const res = await fetch(`${API_BASE}/api/reports/${id}/approve`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: data.message });
        setDispatchedChannels(data.dispatched_channels);
        fetchPending();
      } else {
        setNotification({ type: 'error', message: data.message });
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Network error during approval.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Reject report
  const handleReject = async (id) => {
    setActionLoading(true);
    setNotification(null);
    setDispatchedMailLog(null);
    try {
      const res = await fetch(`${API_BASE}/api/reports/${id}/reject`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: 'Report dismissed.' });
        fetchPending();
      } else {
        setNotification({ type: 'error', message: data.message });
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Network error during rejection.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Copy to clipboard helper
  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(idx);
    setTimeout(() => setCopiedLink(null), 1500);
  };

  // Group outgoing links helper
  const getGroupedLinks = (links) => {
    const groups = {
      whatsapp: [],
      telegram: [],
      google_form: [],
      apk: [],
      other: []
    };
    if (Array.isArray(links)) {
      links.forEach(link => {
        if (groups[link.type]) {
          groups[link.type].push(link);
        } else {
          groups.other.push(link);
        }
      });
    }
    return groups;
  };

  const groupedLinks = selectedReport ? getGroupedLinks(selectedReport.outgoing_links) : null;

  return (
    <div className="admin-dashboard-container">
      {/* Top action details bar */}
      <div className="admin-top-bar">
        <div className="admin-top-title">
          <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>Threat Triage & Review Center</span>
        </div>
        <div className="admin-top-actions">
          <button 
            onClick={handleRunJanitor}
            className="admin-top-btn"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Trigger Janitor Takedown</span>
          </button>
          <button 
            onClick={fetchPending}
            className="admin-refresh-btn"
            title="Refresh Queue"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main split work interface */}
      <div className="admin-workspace">
        
        {/* Left Column: Priority queue */}
        <div className="sidebar-queue-pane">
          <div className="sidebar-queue-header">
            <span className="queue-header-label">Pending Cases ({reports.length})</span>
            <span className="queue-priority-badge">Priority Hit</span>
          </div>

          {loading ? (
            <div className="queue-loading">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mb-2" />
              <span>Loading Queue...</span>
            </div>
          ) : reports.length === 0 ? (
            <div className="queue-empty">
              <ShieldCheck className="queue-empty-icon w-8 h-8" />
              <span>No Threats in Queue</span>
            </div>
          ) : (
            <div>
              {reports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => {
                    setSelectedReport(report);
                    setDispatchedMailLog(null);
                  }}
                  className={`queue-item ${selectedReport?.id === report.id ? 'active' : ''}`}
                >
                  <div className="queue-item-meta">
                    <span className="queue-item-brand">{report.target_brand_raw}</span>
                    <span className="queue-item-hits">
                      <Users className="queue-item-hits-icon w-3 h-3" />
                      <span>{report.hit_count} hits</span>
                    </span>
                  </div>
                  <div className="queue-item-url" title={report.reported_url}>
                    {report.reported_url}
                  </div>
                  <div className="queue-item-time">
                    {report.created_at ? new Date(report.created_at).toLocaleTimeString() : 'Recent'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Middle Column: Visual Evidence & Technical specifications */}
        <div className="middle-forensics-pane">
          {selectedReport ? (
            <>
              <div>
                <h3 className="specs-title">Technical Specifications</h3>
                <div className="specs-card">
                  <div className="specs-grid">
                    <div>
                      <span className="specs-label">Server IP Address</span>
                      <span className="specs-value-mono select-all">
                        {selectedReport.ip_address || 'Pending Lookup'}
                      </span>
                    </div>
                    <div>
                      <span className="specs-label">Hosting Provider</span>
                      <span className="specs-value-text truncate block">
                        {selectedReport.hosting_provider || 'Pending Lookup'}
                      </span>
                    </div>
                    <div className="specs-grid-full">
                      <span className="specs-label">Abuse Contact Email</span>
                      <span className="specs-value-email select-all">
                        <Mail className="w-3.5 h-3.5" />
                        <span>{selectedReport.abuse_email || 'Searching registrars...'}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mock browser frame displaying Mobile screenshot */}
              <div className="screenshot-container">
                <h3 className="specs-title">Forensic Screenshot (Mobile Viewport)</h3>
                <div className="browser-mockup-frame">
                  <div className="browser-header-row">
                    <div className="browser-control-dots">
                      <div className="browser-dot dot-red"></div>
                      <div className="browser-dot dot-yellow"></div>
                      <div className="browser-dot dot-green"></div>
                    </div>
                    <div className="browser-url-input select-all">
                      {selectedReport.reported_url}
                    </div>
                  </div>
                  <div className="browser-body-content">
                    {selectedReport.screenshot_url ? (
                      <img 
                        src={`${API_BASE}${selectedReport.screenshot_url}`} 
                        alt="Phishing mobile preview screenshot" 
                        className="forensic-screenshot-img"
                      />
                    ) : (
                      <div className="screenshot-placeholder">
                        <RefreshCw className="w-8 h-8 animate-spin text-indigo-400 mb-2" />
                        <span>Generating forensic evidence...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="no-case-selected-container">
              <Eye className="no-case-icon w-12 h-12" />
              <h3 className="no-case-title">No Case Selected</h3>
              <p className="no-case-description">
                Select a threat incident from the left sidebar queue to inspect forensic evidence.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Outgoing redirection links grouped by category */}
        <div className="right-links-pane">
          {selectedReport && groupedLinks ? (
            <>
              <div className="platform-title-container">
                <h3 className="platform-title-text">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span>Harvested Outgoing Targets</span>
                </h3>
              </div>

              {/* WhatsApp Cards */}
              <div className="platform-card whatsapp">
                <div className="platform-card-header">WhatsApp Redirection ({groupedLinks.whatsapp.length})</div>
                {groupedLinks.whatsapp.length === 0 ? (
                  <span className="platform-card-empty">No WhatsApp vectors detected.</span>
                ) : (
                  <div className="link-items-list">
                    {groupedLinks.whatsapp.map((l, idx) => (
                      <div key={idx} className="link-item-row">
                        <span className="link-item-url" title={l.url}>{l.url}</span>
                        <div className="link-item-actions">
                          <button onClick={() => handleCopy(l.url, `wa-${idx}`)} className="link-action-btn" title="Copy URL">
                            {copiedLink === `wa-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                          <a href={l.url} target="_blank" rel="noreferrer" className="link-action-btn" title="Visit Link">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Telegram Cards */}
              <div className="platform-card telegram">
                <div className="platform-card-header">Telegram channels ({groupedLinks.telegram.length})</div>
                {groupedLinks.telegram.length === 0 ? (
                  <span className="platform-card-empty">No Telegram vectors detected.</span>
                ) : (
                  <div className="link-items-list">
                    {groupedLinks.telegram.map((l, idx) => (
                      <div key={idx} className="link-item-row">
                        <span className="link-item-url" title={l.url}>{l.url}</span>
                        <div className="link-item-actions">
                          <button onClick={() => handleCopy(l.url, `tg-${idx}`)} className="link-action-btn" title="Copy URL">
                            {copiedLink === `tg-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                          <a href={l.url} target="_blank" rel="noreferrer" className="link-action-btn" title="Visit Link">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Google Form Cards */}
              <div className="platform-card google-form">
                <div className="platform-card-header">Credential Forms ({groupedLinks.google_form.length})</div>
                {groupedLinks.google_form.length === 0 ? (
                  <span className="platform-card-empty">No credential forms detected.</span>
                ) : (
                  <div className="link-items-list">
                    {groupedLinks.google_form.map((l, idx) => (
                      <div key={idx} className="link-item-row">
                        <span className="link-item-url" title={l.url}>{l.url}</span>
                        <div className="link-item-actions">
                          <button onClick={() => handleCopy(l.url, `gf-${idx}`)} className="link-action-btn" title="Copy URL">
                            {copiedLink === `gf-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                          <a href={l.url} target="_blank" rel="noreferrer" className="link-action-btn" title="Visit Link">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* APK Downloads */}
              <div className="platform-card apk">
                <div className="platform-card-header">APK Malware Targets ({groupedLinks.apk.length})</div>
                {groupedLinks.apk.length === 0 ? (
                  <span className="platform-card-empty">No APK downloads detected.</span>
                ) : (
                  <div className="link-items-list">
                    {groupedLinks.apk.map((l, idx) => (
                      <div key={idx} className="link-item-row">
                        <span className="link-item-url" title={l.url}>{l.url}</span>
                        <div className="link-item-actions">
                          <button onClick={() => handleCopy(l.url, `apk-${idx}`)} className="link-action-btn" title="Copy URL">
                            {copiedLink === `apk-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                          <a href={l.url} target="_blank" rel="noreferrer" className="link-action-btn" title="Visit Link">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Other Targets */}
              <div className="platform-card other">
                <div className="platform-card-header">Other Redirects ({groupedLinks.other.length})</div>
                {groupedLinks.other.length === 0 ? (
                  <span className="platform-card-empty">No other targets detected.</span>
                ) : (
                  <div className="link-items-list">
                    {groupedLinks.other.map((l, idx) => (
                      <div key={idx} className="link-item-row">
                        <span className="link-item-url" title={l.url}>{l.url}</span>
                        <div className="link-item-actions">
                          <button onClick={() => handleCopy(l.url, `other-${idx}`)} className="link-action-btn" title="Copy URL">
                            {copiedLink === `other-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                          <a href={l.url} target="_blank" rel="noreferrer" className="link-action-btn" title="Visit Link">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="no-case-selected-container">
              <Terminal className="no-case-icon w-12 h-12" />
              <h3 className="no-case-title">No Case Selected</h3>
              <p className="no-case-description">
                Incident redirection targets will appear here once a case is selected.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Bottom Action Footer */}
      {selectedReport && (
        <div className="admin-action-bar">
          <div className="action-bar-inner">
            <div className="active-case-section">
              <span>Active Case:</span>
              <span className="active-case-id-badge">{selectedReport.id}</span>
            </div>
            
            <div className="action-buttons-group">
              <button
                onClick={() => handleReject(selectedReport.id)}
                disabled={actionLoading}
                className="action-btn action-btn-reject"
              >
                <ShieldX className="w-4 h-4" />
                <span>Reject Report</span>
              </button>
              <button
                onClick={() => handleApprove(selectedReport.id)}
                disabled={actionLoading}
                className="action-btn action-btn-approve"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Approve & Send Takedown</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch notifications/console log area below workspace */}
      {(notification || dispatchedMailLog || dispatchedChannels) && (
        <div className="px-6 pb-4 bg-[#0a0c12] border-t border-white/5 flex flex-col gap-3 shrink-0">
          {notification && (
            <div className={`p-3 rounded-lg border text-xs font-semibold ${
              notification.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/15 text-emerald-400' :
              notification.type === 'error' ? 'bg-rose-500/5 border-rose-500/15 text-rose-400' :
              'bg-indigo-500/5 border-indigo-500/15 text-indigo-400'
            }`}>
              {notification.message}
            </div>
          )}

          {dispatchedChannels && (
            <div className="dispatch-mail-overlay-log">
              <div className="dispatch-log-header">
                <Terminal className="w-3.5 h-3.5 inline-block mr-1 text-emerald-400" />
                <span>Multi-Vector Threat Intelligence Broadcast Log</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-2">
                <div className="p-2.5 rounded bg-white/5 border border-white/10 text-xs">
                  <div className="font-semibold text-emerald-400 mb-1">📧 Registrar Abuse Email</div>
                  <div className="text-gray-400">Target: <span className="text-gray-200 font-mono">{dispatchedChannels.registrar_abuse?.target}</span></div>
                  <div className="text-[10px] text-emerald-400/80 font-mono mt-1">Status: DISPATCHED</div>
                </div>

                <div className="p-2.5 rounded bg-white/5 border border-white/10 text-xs">
                  <div className="font-semibold text-rose-400 mb-1">🔴 Google Safe Browsing</div>
                  <div className="text-gray-400">Action: <span className="text-gray-200">Triggers Red Interstitial Warning Screen</span></div>
                  <div className="text-[10px] text-emerald-400/80 font-mono mt-1">Status: SUBMITTED</div>
                </div>

                <div className="p-2.5 rounded bg-white/5 border border-white/10 text-xs">
                  <div className="font-semibold text-sky-400 mb-1">🪟 MS SmartScreen</div>
                  <div className="text-gray-400">Action: <span className="text-gray-200">Triggers Edge & Defender Blocklist</span></div>
                  <div className="text-[10px] text-emerald-400/80 font-mono mt-1">Status: SUBMITTED</div>
                </div>

                <div className="p-2.5 rounded bg-white/5 border border-white/10 text-xs">
                  <div className="font-semibold text-yellow-400 mb-1">🔒 McAfee WebAdvisor</div>
                  <div className="text-gray-400">Action: <span className="text-gray-200">SiteAdvisor Threat Entry</span></div>
                  <div className="text-[10px] text-emerald-400/80 font-mono mt-1">Status: SUBMITTED</div>
                </div>

                <div className="p-2.5 rounded bg-white/5 border border-white/10 text-xs">
                  <div className="font-semibold text-indigo-400 mb-1">🌐 NordVPN CyberSec</div>
                  <div className="text-gray-400">Action: <span className="text-gray-200">Nord Threat Protection DNS Block</span></div>
                  <div className="text-[10px] text-emerald-400/80 font-mono mt-1">Status: SUBMITTED</div>
                </div>
              </div>
            </div>
          )}

          {dispatchedMailLog && (
            <div className="dispatch-mail-overlay-log">
              <div className="dispatch-log-header">
                <Terminal className="w-3.5 h-3.5 inline-block mr-1" />
                <span>Abuse Email Dispatch Log</span>
              </div>
              <div><span className="text-gray-500">TO:</span> <span className="text-white font-bold">{dispatchedMailLog.to}</span></div>
              <div><span className="text-gray-500">SUBJECT:</span> <span className="text-white font-bold">{dispatchedMailLog.subject}</span></div>
              <div className="mt-2 text-gray-300 whitespace-pre-wrap">{dispatchedMailLog.body}</div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
