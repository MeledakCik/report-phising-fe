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
    SENT: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    SUBMITTED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    FAILED: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    PASSED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    CLEAN: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    WARNING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    CRITICAL: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    UNKNOWN: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    SKIPPED: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  };
  const icons = {
    DISPATCHED: <CheckCircle className="w-3 h-3 mr-1" />,
    SENT: <CheckCircle className="w-3 h-3 mr-1" />,
    SUBMITTED: <Clock className="w-3 h-3 mr-1" />,
    FAILED: <XCircle className="w-3 h-3 mr-1" />,
    PENDING: <AlertTriangle className="w-3 h-3 mr-1" />,
    PASSED: <CheckCircle className="w-3 h-3 mr-1" />,
    CLEAN: <CheckCircle className="w-3 h-3 mr-1" />,
    WARNING: <AlertTriangle className="w-3 h-3 mr-1" />,
    CRITICAL: <XCircle className="w-3 h-3 mr-1" />,
    UNKNOWN: <AlertTriangle className="w-3 h-3 mr-1" />,
    SKIPPED: <Clock className="w-3 h-3 mr-1" />
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
  const [dispatchedReportUrl, setDispatchedReportUrl] = useState(null);
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
    setDispatchedReportUrl(null);
    const approvedUrl = reports.find(r => r.id === id)?.reported_url || null;
    try {
      const res = await fetch(`${API_BASE}/api/reports/${id}/approve`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: data.message });
        if (data.dispatched_channels) {
          setDispatchedChannels(data.dispatched_channels);
          setDispatchedReportUrl(approvedUrl);
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
    setDispatchedReportUrl(null);
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

  // Copy the reported URL and open Google's manual phishing report form in a
  // new tab, ready to paste — Google has no API/prefill param for this form.
  const handleCopyAndOpenGSB = (url, manualUrl) => {
    if (url) {
      navigator.clipboard.writeText(url);
      setCopiedLink('gsb-manual');
      setTimeout(() => setCopiedLink(null), 1500);
    }
    window.open(manualUrl, '_blank', 'noopener,noreferrer');
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

  // Derive analysis data straight from the report's real fields.
  // These are populated by the backend's forensic worker (SSL socket check,
  // real TCP port scan, URLhaus blacklist lookup, RDAP domain age, CDN
  // header detection) - nothing here is hardcoded or simulated.
  const getAnalysisData = (report) => {
    if (!report) return null;

    const isScanned = !!report.last_checked_at;

    const openPorts = (() => {
      try {
        const parsed = JSON.parse(report.open_ports || '[]');
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })();
    const openList = openPorts.filter(p => p.open);
    const closedList = openPorts.filter(p => !p.open);

    const analysis = {
      crawl_status: {
        status: report.screenshot_url ? 'PASSED' : isScanned ? 'WARNING' : 'PENDING',
        value: report.screenshot_url ? 'Successfully crawled' : isScanned ? 'Crawl failed or blocked' : 'Pending scan',
        detail: report.last_checked_at ? `Last scan: ${new Date(report.last_checked_at).toLocaleString()}` : 'Waiting for janitor...',
        loading: !isScanned
      },
      ssl_certificate: {
        status: report.ssl_status || (isScanned ? 'UNKNOWN' : 'PENDING'),
        value: report.ssl_status === 'CRITICAL' || report.ssl_status === 'UNKNOWN'
          ? 'No valid certificate'
          : report.ssl_issuer ? `Valid — Issued by ${report.ssl_issuer}` : '—',
        detail: report.ssl_expiry
          ? `Expires: ${new Date(report.ssl_expiry).toLocaleDateString()} (${report.ssl_days_left}d left)`
          : 'Checked via live TLS handshake',
        loading: !isScanned
      },
      dns_records: {
        status: report.ip_address && report.ip_address !== 'Unknown' ? 'PASSED' : isScanned ? 'WARNING' : 'PENDING',
        value: report.ip_address && report.ip_address !== 'Unknown' ? `A: ${report.ip_address}` : 'Could not resolve',
        detail: report.cdn_provider ? `Behind ${report.cdn_provider}` : 'Direct resolution',
        loading: !isScanned
      },
      open_ports: {
        status: openList.some(p => ['FTP', 'RDP', 'MySQL'].includes(p.label)) ? 'WARNING' : isScanned ? 'PASSED' : 'PENDING',
        value: openPorts.length ? `${openList.length}/${openPorts.length} ports open` : '—',
        detail: openList.length ? `Open: ${openList.map(p => p.label).join(', ')}` : closedList.length ? 'All scanned ports closed' : 'Real-time TCP scan',
        loading: !isScanned
      },
      blacklist_status: {
        status: report.blacklist_status || (isScanned ? 'UNKNOWN' : 'PENDING'),
        value: report.blacklist_status === 'CRITICAL' ? 'Listed on URLhaus' : report.blacklist_status === 'PASSED' ? 'Not blacklisted' : '—',
        detail: report.blacklist_detail || 'Checked against abuse.ch URLhaus',
        loading: !isScanned
      },
      domain_age: {
        status: report.domain_age_days != null ? (report.domain_age_days < 90 ? 'WARNING' : 'PASSED') : isScanned ? 'UNKNOWN' : 'PENDING',
        value: report.domain_age_days != null ? `Registered ${report.domain_age_days} days ago` : 'Unknown (RDAP unavailable)',
        detail: report.domain_registered_at ? `Created: ${new Date(report.domain_registered_at).toLocaleDateString()}` : '—',
        loading: !isScanned
      },
      registrar_info: {
        status: report.registrar_name ? 'PASSED' : isScanned ? 'UNKNOWN' : 'PENDING',
        value: report.registrar_name || report.hosting_provider || '—',
        detail: report.abuse_email ? `Abuse: ${report.abuse_email}` : '—',
        loading: !isScanned
      },
      cdn_detection: {
        status: report.cdn_provider ? 'WARNING' : isScanned ? 'PASSED' : 'PENDING',
        value: report.cdn_provider || 'No CDN detected',
        detail: report.cdn_provider ? 'Detected via live HTTP response headers' : 'Origin server exposed directly',
        loading: !isScanned
      }
    };

    return analysis;
  };

  const analysisData = selectedReport ? getAnalysisData(selectedReport) : null;

  // Compute overall posture summary from the real per-check statuses
  const analysisSummary = (() => {
    if (!analysisData) return null;
    const entries = Object.entries(analysisData);
    const statuses = entries.map(([, v]) => v.status);
    const passed = statuses.filter(s => s === 'PASSED').length;
    const warnings = statuses.filter(s => s === 'WARNING').length;
    const critical = statuses.filter(s => s === 'CRITICAL').length;
    const pending = statuses.filter(s => s === 'PENDING').length;

    let overall = 'PASSED';
    if (pending === entries.length) overall = 'PENDING';
    else if (critical > 0) overall = 'CRITICAL';
    else if (warnings > 0) overall = 'WARNING';

    const badgeLabelMap = {
      crawl_status: 'Crawl',
      ssl_certificate: 'SSL',
      dns_records: 'DNS',
      open_ports: 'Ports',
      blacklist_status: 'Blacklist',
      domain_age: 'Domain Age',
      registrar_info: 'Registrar',
      cdn_detection: analysisData.cdn_detection.value !== 'No CDN detected' ? analysisData.cdn_detection.value : 'CDN'
    };
    const flaggedBadges = entries
      .filter(([, v]) => v.status === 'WARNING' || v.status === 'CRITICAL')
      .map(([k, v]) => ({ label: badgeLabelMap[k] || k, status: v.status }));
    const okBadges = entries
      .filter(([, v]) => v.status === 'PASSED')
      .slice(0, 4)
      .map(([k]) => ({ label: badgeLabelMap[k] || k, status: 'PASSED' }));

    return { overall, passed, warnings, critical, pending, total: entries.length, badges: [...flaggedBadges, ...okBadges].slice(0, 6) };
  })();

  // Channel cards configuration
  const channelConfigs = [
    {
      key: 'registrar_abuse',
      icon: Mail,
      label: 'Registrar Abuse Email',
      accent: 'text-sky-400 bg-sky-500/10 border-sky-500/20'
    },
    {
      key: 'kominfo_aduan_konten',
      icon: Globe,
      label: 'Kominfo Aduan Konten',
      accent: 'text-red-400 bg-red-500/10 border-red-500/20'
    },
    {
      key: 'google_safe_browsing',
      icon: ShieldCheck,
      label: 'Google Safe Browsing',
      accent: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    },
    {
      key: 'vercel_abuse',
      icon: Cloud,
      label: 'Vercel Abuse Desk',
      accent: 'text-violet-400 bg-violet-500/10 border-violet-500/20'
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
                    setDispatchedReportUrl(null);
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
        <div className="w-96 min-w-[380px] p-5 overflow-y-auto bg-[#0b0d14]/40 flex flex-col gap-4 flex-shrink-0 border-l border-white/5">
          {selectedReport && analysisData ? (
            <>
              {/* Header dengan border bawah */}
              <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
                <Shield className="w-5 h-5 text-cyan-400" />
                <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">
                  Technical Footprint & Security Analysis
                </h3>
              </div>

              {/* Detector Cards - grid layout */}
              <div className="grid grid-cols-2 gap-2.5">
                <DetectorCard
                  icon={Activity}
                  label="Crawl Status"
                  {...analysisData.crawl_status}
                />
                <DetectorCard
                  icon={Lock}
                  label="SSL Certificate"
                  {...analysisData.ssl_certificate}
                />
                <DetectorCard
                  icon={Globe}
                  label="DNS Records"
                  {...analysisData.dns_records}
                />
                <DetectorCard
                  icon={Wifi}
                  label="Open Ports"
                  {...analysisData.open_ports}
                />
                <DetectorCard
                  icon={AlertOctagon}
                  label="Blacklist Status"
                  {...analysisData.blacklist_status}
                />
                <DetectorCard
                  icon={Calendar}
                  label="Domain Age"
                  {...analysisData.domain_age}
                />
                <DetectorCard
                  icon={Database}
                  label="Registrar Info"
                  {...analysisData.registrar_info}
                />
                <DetectorCard
                  icon={Cloud}
                  label="CDN Detection"
                  {...analysisData.cdn_detection}
                />
              </div>

              {/* Summary Badge - computed live from real check results */}
              <div className="mt-1 p-4 rounded-xl bg-gradient-to-br from-black/40 via-black/30 to-black/20 border border-white/10 backdrop-blur-sm shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                    Overall Security Posture
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                    analysisSummary.overall === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border-rose-500/20' :
                    analysisSummary.overall === 'WARNING' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20' :
                    analysisSummary.overall === 'PENDING' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/20' :
                    'bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                  }`}>
                    <AlertTriangle className="w-3 h-3" />
                    {analysisSummary.overall}
                  </span>
                </div>
                <div className="text-xs text-gray-300 mt-1.5 font-medium">
                  {analysisSummary.pending === analysisSummary.total
                    ? 'Scan pending — waiting for forensic worker'
                    : `${analysisSummary.passed}/${analysisSummary.total} checks passed, ${analysisSummary.warnings + analysisSummary.critical} flagged`}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {analysisSummary.badges.map((b, i) => (
                    <span
                      key={i}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                        b.status === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border-rose-500/20' :
                        b.status === 'WARNING' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20' :
                        'bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                      }`}
                    >
                      {b.status === 'PASSED' ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {b.label}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-gray-400 p-8 text-center">
              <Shield className="w-12 h-12 text-white/5 mb-4" />
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">No Case Selected</h3>
              <p className="text-xs max-w-xs mt-2 leading-relaxed text-gray-500">
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
        <div className="dispatch-section">
          {notification && (
            <div
              className={`p-3 rounded-lg border text-xs font-semibold ${notification.type === 'success'
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
                <div className="dispatch-log-header-left">
                  <span className="dispatch-log-icon-badge">
                    <Terminal className="w-3.5 h-3.5" />
                  </span>
                  <span>Multi-Vector Threat Intelligence Broadcast Log</span>
                </div>
                {dispatchedChannels.dispatched_at && (
                  <span className="dispatch-log-timestamp">
                    {new Date(dispatchedChannels.dispatched_at).toLocaleString()}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {channelConfigs.map((cfg) => {
                  const channel = dispatchedChannels[cfg.key];
                  if (!channel) return null;
                  const Icon = cfg.icon;
                  return (
                    <div key={cfg.key} className="dispatch-channel-card">
                      <div className="dispatch-channel-card-header">
                        <span className={`dispatch-channel-icon ${cfg.accent}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </span>
                        <span className="dispatch-channel-label">{cfg.label}</span>
                        <StatusBadge status={channel.status} />
                      </div>
                      <div className="dispatch-channel-body">
                        {channel.target && (
                          <div className="dispatch-channel-row">
                            <span className="dispatch-channel-row-label">Target</span>
                            <span className="dispatch-channel-row-value font-mono">{channel.target}</span>
                          </div>
                        )}
                        {channel.subject && (
                          <div className="dispatch-channel-row">
                            <span className="dispatch-channel-row-label">Subject</span>
                            <span className="dispatch-channel-row-value">{channel.subject}</span>
                          </div>
                        )}
                        {channel.note && (
                          <div className="dispatch-channel-row">
                            <span className="dispatch-channel-row-label">Note</span>
                            <span className="dispatch-channel-row-value">{channel.note}</span>
                          </div>
                        )}
                        {channel.threat_types && (
                          <div className="dispatch-channel-row">
                            <span className="dispatch-channel-row-label">Threats</span>
                            <span className="dispatch-channel-row-value">{channel.threat_types}</span>
                          </div>
                        )}
                        {channel.error && (
                          <div className="dispatch-channel-row dispatch-channel-row-error">
                            <span className="dispatch-channel-row-label">Error</span>
                            <span className="dispatch-channel-row-value">{channel.error}</span>
                          </div>
                        )}
                        {channel.manual_submission_url && (
                          <button
                            type="button"
                            onClick={() => handleCopyAndOpenGSB(dispatchedReportUrl, channel.manual_submission_url)}
                            className="dispatch-channel-link"
                          >
                            {copiedLink === 'gsb-manual' ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            {copiedLink === 'gsb-manual' ? 'URL copied — pasting into opened tab' : 'Copy URL & report to Google'}
                          </button>
                        )}
                      </div>
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