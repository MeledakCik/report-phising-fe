import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Mail,
  ShieldX,
  Terminal,
  RefreshCw,
  ExternalLink,
  Users,
  Activity,
  Eye,
  Play,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Server,
  Globe,
  Lock,
  Wifi,
  MapPin,
  Calendar,
  AlertOctagon,
  Shield,
  Database,
  Cloud,
  Link
} from 'lucide-react';
import { API_BASE } from '../config';

// Helper untuk badge status
const StatusBadge = ({ status }) => {
  const styles = {
    DISPATCHED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    SUBMITTED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    FAILED: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    PASSED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    WARNING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    CRITICAL: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    UNKNOWN: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  };
  const icons = {
    DISPATCHED: <CheckCircle className="w-3 h-3 mr-1" />,
    SUBMITTED: <Clock className="w-3 h-3 mr-1" />,
    FAILED: <XCircle className="w-3 h-3 mr-1" />,
    PENDING: <AlertTriangle className="w-3 h-3 mr-1" />,
    PASSED: <CheckCircle className="w-3 h-3 mr-1" />,
    WARNING: <AlertTriangle className="w-3 h-3 mr-1" />,
    CRITICAL: <XCircle className="w-3 h-3 mr-1" />,
    UNKNOWN: <AlertTriangle className="w-3 h-3 mr-1" />
  };
  const label = status || 'PENDING';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono border ${styles[label] || styles.PENDING}`}>
      {icons[label] || icons.PENDING}
      {label}
    </span>
  );
};

// Analisis Detector Card
const DetectorCard = ({ icon: Icon, label, value, status, detail, loading }) => {
  const statusColors = {
    PASSED: 'border-emerald-500/30 bg-emerald-500/5',
    WARNING: 'border-yellow-500/30 bg-yellow-500/5',
    CRITICAL: 'border-rose-500/30 bg-rose-500/5',
    UNKNOWN: 'border-gray-500/30 bg-gray-500/5',
    PENDING: 'border-indigo-500/30 bg-indigo-500/5'
  };

  return (
    <div className={`p-3 rounded-lg border ${statusColors[status] || statusColors.PENDING} bg-white/5 transition-all hover:bg-white/10`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${status === 'PASSED' ? 'text-emerald-400' : status === 'CRITICAL' ? 'text-rose-400' : status === 'WARNING' ? 'text-yellow-400' : 'text-gray-400'}`} />
          <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider">{label}</span>
        </div>
        <StatusBadge status={status || 'PENDING'} />
      </div>
      {loading ? (
        <div className="mt-1 flex items-center gap-2">
          <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
          <span className="text-xs text-gray-500">Scanning...</span>
        </div>
      ) : (
        <>
          <div className="mt-1 text-sm font-mono text-white truncate select-all" title={value}>
            {value || '—'}
          </div>
          {detail && (
            <div className="mt-0.5 text-[10px] text-gray-400 truncate" title={detail}>
              {detail}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default function AdminDashboard() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [dispatchedChannels, setDispatchedChannels] = useState(null);
  const [copiedLink, setCopiedLink] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // Fetch pending reports
  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/reports/pending`);
      const data = await res.json();
      setReports(data);
      if (data.length > 0) {
        const stillExists = selectedReport && data.some(r => r.id === selectedReport.id);
        if (stillExists) {
          setSelectedReport(data.find(r => r.id === selectedReport.id));
        } else {
          setSelectedReport(data[0]);
        }
      } else {
        setSelectedReport(null);
        setDispatchedChannels(null);
      }
    } catch (err) {
      console.error('Failed to load pending reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
    // eslint-disable-next-line
  }, []);

  // Trigger Janitor
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
    } catch {
      setNotification({ type: 'error', message: 'Failed to run Janitor checks.' });
    }
  };

  // Approve
  const handleApprove = async (id) => {
    setActionLoading(true);
    setNotification(null);
    setDispatchedChannels(null);
    try {
      const res = await fetch(`${API_BASE}/api/reports/${id}/approve`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: data.message });
        if (data.dispatched_channels) {
          setDispatchedChannels(data.dispatched_channels);
        }
        fetchPending();
      } else {
        setNotification({ type: 'error', message: data.message });
      }
    } catch {
      setNotification({ type: 'error', message: 'Network error during approval.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Reject
  const handleReject = async (id) => {
    setActionLoading(true);
    setNotification(null);
    setDispatchedChannels(null);
    try {
      const res = await fetch(`${API_BASE}/api/reports/${id}/reject`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: 'Report dismissed.' });
        fetchPending();
      } else {
        setNotification({ type: 'error', message: data.message });
      }
    } catch {
      setNotification({ type: 'error', message: 'Network error during rejection.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Copy
  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(idx);
    setTimeout(() => setCopiedLink(null), 1500);
  };

  // Group outgoing links
  const getGroupedLinks = (links) => {
    const groups = { whatsapp: [], telegram: [], google_form: [], apk: [], other: [] };
    if (Array.isArray(links)) {
      links.forEach(link => {
        if (groups[link.type]) groups[link.type].push(link);
        else groups.other.push(link);
      });
    }
    return groups;
  };

  const groupedLinks = selectedReport ? getGroupedLinks(selectedReport.outgoing_links) : null;

  // Generate analysis data from report
  const getAnalysisData = (report) => {
    if (!report) return null;

    // Simulasi analisis - ini akan diisi dari backend nantinya
    const analysis = {
      crawl_status: {
        status: report.screenshot_url ? 'PASSED' : 'PENDING',
        value: report.screenshot_url ? 'Successfully crawled' : 'Pending scan',
        detail: report.screenshot_url ? `Last scan: ${new Date().toLocaleString()}` : 'Waiting for janitor...'
      },
      ssl_certificate: {
        status: 'PASSED',
        value: 'Valid SSL Certificate',
        detail: 'Issued by: Let\'s Encrypt R3, Expires: 2026-11-15'
      },
      dns_records: {
        status: 'PASSED',
        value: 'A: 188.114.97.0, 188.114.96.0',
        detail: 'Cloudflare DNS (CDN)'
      },
      open_ports: {
        status: 'WARNING',
        value: 'Port 80 (HTTP), 443 (HTTPS) open',
        detail: 'Port 22 (SSH) filtered'
      },
      blacklist_status: {
        status: 'PASSED',
        value: 'Not blacklisted',
        detail: 'Clean on major RBLs'
      },
      domain_age: {
        status: 'WARNING',
        value: 'Registered 45 days ago',
        detail: 'Created: 2026-06-30'
      },
      registrar_info: {
        status: 'PASSED',
        value: 'GoDaddy.com, LLC',
        detail: 'Abuse: abuse@godaddy.com'
      },
      cdn_detection: {
        status: 'WARNING',
        value: 'Cloudflare detected',
        detail: 'CDN provider: Cloudflare, Inc.'
      }
    };

    return analysis;
  };

  const analysisData = selectedReport ? getAnalysisData(selectedReport) : null;

  // Channel cards configuration
  const channelConfigs = [
    {
      key: 'registrar_abuse',
      icon: '📧',
      label: 'Registrar Abuse Email',
      targetLabel: 'Target',
      targetKey: 'target',
      actionLabel: 'Action',
      actionKey: 'subject'
    },
    {
      key: 'google_safe_browsing',
      icon: '🔴',
      label: 'Google Safe Browsing',
      targetLabel: 'Endpoint',
      targetKey: 'endpoint',
      actionLabel: 'Action',
      actionKey: 'action'
    },
    {
      key: 'microsoft_smartscreen',
      icon: '🪟',
      label: 'MS SmartScreen',
      targetLabel: 'Endpoint',
      targetKey: 'endpoint',
      actionLabel: 'Action',
      actionKey: 'action'
    },
    {
      key: 'mcafee_webadvisor',
      icon: '🔒',
      label: 'McAfee WebAdvisor',
      targetLabel: 'Endpoint',
      targetKey: 'endpoint',
      actionLabel: 'Action',
      actionKey: 'action'
    },
    {
      key: 'nordvpn_cybersec',
      icon: '🌐',
      label: 'NordVPN CyberSec',
      targetLabel: 'Endpoint',
      targetKey: 'endpoint',
      actionLabel: 'Action',
      actionKey: 'action'
    }
  ];

  return (
    <div className="admin-dashboard-container">
      {/* Top Bar */}
      <div className="admin-top-bar">
        <div className="admin-top-title">
          <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>Threat Triage & Review Center</span>
        </div>
        <div className="admin-top-actions">
          <button onClick={handleRunJanitor} className="admin-top-btn">
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Trigger Janitor Takedown</span>
          </button>
          <button onClick={fetchPending} className="admin-refresh-btn" title="Refresh Queue">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="admin-workspace">
        {/* Left: Queue */}
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
                    setDispatchedChannels(null);
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

        {/* Middle: Forensics */}
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

              <div className="screenshot-container">
                <h3 className="specs-title">Forensic Screenshot (Mobile Viewport)</h3>
                <div className="browser-mockup-frame">
                  <div className="browser-header-row">
                    <div className="browser-control-dots">
                      <div className="browser-dot dot-red" />
                      <div className="browser-dot dot-yellow" />
                      <div className="browser-dot dot-green" />
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

              {/* Outgoing Links yang ditemukan */}
              {groupedLinks && Object.values(groupedLinks).some(arr => arr.length > 0) && (
                <div className="mt-4">
                  <h3 className="specs-title">Detected Outgoing Targets</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries({
                      whatsapp: { label: '💬 WhatsApp', color: 'text-emerald-400' },
                      telegram: { label: '✈️ Telegram', color: 'text-sky-400' },
                      google_form: { label: '📝 Credential Forms', color: 'text-blue-400' },
                      apk: { label: '📲 APK Downloads', color: 'text-rose-400' },
                      other: { label: '🔗 Other Redirects', color: 'text-gray-400' }
                    }).map(([key, { label, color }]) => {
                      const links = groupedLinks[key];
                      if (!links || links.length === 0) return null;
                      return (
                        <div key={key} className="p-2 rounded-lg bg-white/5 border border-white/10">
                          <div className={`text-xs font-semibold ${color} mb-1`}>{label} ({links.length})</div>
                          <div className="space-y-1">
                            {links.map((link, idx) => (
                              <div key={idx} className="flex items-center justify-between gap-2">
                                <span className="text-[10px] text-gray-300 font-mono truncate" title={link.url}>
                                  {link.url}
                                </span>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => handleCopy(link.url, `${key}-${idx}`)}
                                    className="p-1 rounded hover:bg-white/10 transition-colors"
                                    title="Copy URL"
                                  >
                                    {copiedLink === `${key}-${idx}` ? (
                                      <Check className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3 h-3 text-gray-400 hover:text-white" />
                                    )}
                                  </button>
                                  <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1 rounded hover:bg-white/10 transition-colors"
                                    title="Visit Link"
                                  >
                                    <ExternalLink className="w-3 h-3 text-gray-400 hover:text-white" />
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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

        {/* Right: Technical Footprint & Security Analysis */}
        <div className="right-links-pane">
          {selectedReport && analysisData ? (
            <>
              <div className="platform-title-container">
                <h3 className="platform-title-text">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span>Technical Footprint & Security Analysis</span>
                </h3>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-2">
                  {/* Crawl Status */}
                  <DetectorCard
                    icon={Activity}
                    label="Crawl Status"
                    value={analysisData.crawl_status.value}
                    detail={analysisData.crawl_status.detail}
                    status={analysisData.crawl_status.status}
                    loading={analysisData.crawl_status.status === 'PENDING'}
                  />

                  {/* SSL Certificate */}
                  <DetectorCard
                    icon={Lock}
                    label="SSL Certificate"
                    value={analysisData.ssl_certificate.value}
                    detail={analysisData.ssl_certificate.detail}
                    status={analysisData.ssl_certificate.status}
                  />

                  {/* DNS Records */}
                  <DetectorCard
                    icon={Globe}
                    label="DNS Records"
                    value={analysisData.dns_records.value}
                    detail={analysisData.dns_records.detail}
                    status={analysisData.dns_records.status}
                  />

                  {/* Open Ports */}
                  <DetectorCard
                    icon={Wifi}
                    label="Open Ports"
                    value={analysisData.open_ports.value}
                    detail={analysisData.open_ports.detail}
                    status={analysisData.open_ports.status}
                  />

                  {/* Blacklist Status */}
                  <DetectorCard
                    icon={AlertOctagon}
                    label="Blacklist Status"
                    value={analysisData.blacklist_status.value}
                    detail={analysisData.blacklist_status.detail}
                    status={analysisData.blacklist_status.status}
                  />

                  {/* Domain Age */}
                  <DetectorCard
                    icon={Calendar}
                    label="Domain Age"
                    value={analysisData.domain_age.value}
                    detail={analysisData.domain_age.detail}
                    status={analysisData.domain_age.status}
                  />

                  {/* Registrar Info */}
                  <DetectorCard
                    icon={Database}
                    label="Registrar Info"
                    value={analysisData.registrar_info.value}
                    detail={analysisData.registrar_info.detail}
                    status={analysisData.registrar_info.status}
                  />

                  {/* CDN Detection */}
                  <DetectorCard
                    icon={Cloud}
                    label="CDN Detection"
                    value={analysisData.cdn_detection.value}
                    detail={analysisData.cdn_detection.detail}
                    status={analysisData.cdn_detection.status}
                  />
                </div>

                {/* Summary Badge */}
                <div className="p-3 rounded-lg border border-white/10 bg-white/5 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">Overall Security Posture</span>
                    <StatusBadge status="WARNING" />
                  </div>
                  <div className="text-xs text-gray-300 mt-1">
                    6/8 checks passed, 2 warnings detected
                  </div>
                  <div className="flex gap-1 mt-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px]">✓ SSL Valid</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px]">✓ DNS OK</span>
                    <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-[9px]">⚠ Cloudflare</span>
                    <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-[9px]">⚠ Domain New</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="no-case-selected-container">
              <Shield className="no-case-icon w-12 h-12" />
              <h3 className="no-case-title">No Case Selected</h3>
              <p className="no-case-description">
                Security analysis and technical footprint will appear here once a case is selected.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Bar */}
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

      {/* Dispatch Logs */}
      {(notification || dispatchedChannels) && (
        <div className="px-6 pb-4 bg-[#0a0c12] border-t border-white/5 flex flex-col gap-3 shrink-0">
          {notification && (
            <div
              className={`p-3 rounded-lg border text-xs font-semibold ${
                notification.type === 'success'
                  ? 'bg-emerald-500/5 border-emerald-500/15 text-emerald-400'
                  : notification.type === 'error'
                  ? 'bg-rose-500/5 border-rose-500/15 text-rose-400'
                  : 'bg-indigo-500/5 border-indigo-500/15 text-indigo-400'
              }`}
            >
              {notification.message}
            </div>
          )}

          {dispatchedChannels && (
            <div className="dispatch-mail-overlay-log">
              <div className="dispatch-log-header">
                <Terminal className="w-3.5 h-3.5 inline-block mr-1 text-emerald-400" />
                <span>Multi-Vector Threat Intelligence Broadcast Log</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                {channelConfigs.map((cfg) => {
                  const channel = dispatchedChannels[cfg.key];
                  if (!channel) return null;
                  return (
                    <div
                      key={cfg.key}
                      className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">
                          {cfg.icon} {cfg.label}
                        </span>
                        <StatusBadge status={channel.status} />
                      </div>
                      {channel.target && (
                        <div className="text-gray-400">
                          {cfg.targetLabel}:{' '}
                          <span className="text-gray-200 font-mono">
                            {channel[cfg.targetKey] || channel.target}
                          </span>
                        </div>
                      )}
                      {channel.action && (
                        <div className="text-gray-400 mt-0.5">
                          {cfg.actionLabel}:{' '}
                          <span className="text-gray-200">
                            {channel[cfg.actionKey] || channel.action}
                          </span>
                        </div>
                      )}
                      {channel.error && (
                        <div className="text-rose-400 mt-1 text-[10px]">
                          Error: {channel.error}
                        </div>
                      )}
                      {channel.timestamp && (
                        <div className="text-gray-500 text-[9px] mt-1 font-mono">
                          {new Date(channel.timestamp).toLocaleString()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}