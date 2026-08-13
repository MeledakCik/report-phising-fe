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
  Lock,
  Globe,
  Wifi,
  Calendar,
  AlertOctagon,
  Database,
  Cloud,
  Shield,
} from 'lucide-react';
import { API_BASE } from '../config';

// ------------------------------------------------------------
//  Komponen StatusBadge (Tailwind only)
// ------------------------------------------------------------
const StatusBadge = ({ status }) => {
  const styles = {
    DISPATCHED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    SUBMITTED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    FAILED: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    PASSED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    WARNING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    CRITICAL: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    UNKNOWN: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };
  const icons = {
    DISPATCHED: <CheckCircle className="w-3 h-3 mr-1" />,
    SUBMITTED: <Clock className="w-3 h-3 mr-1" />,
    FAILED: <XCircle className="w-3 h-3 mr-1" />,
    PENDING: <AlertTriangle className="w-3 h-3 mr-1" />,
    PASSED: <CheckCircle className="w-3 h-3 mr-1" />,
    WARNING: <AlertTriangle className="w-3 h-3 mr-1" />,
    CRITICAL: <XCircle className="w-3 h-3 mr-1" />,
    UNKNOWN: <AlertTriangle className="w-3 h-3 mr-1" />,
  };
  const label = status || 'PENDING';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono border ${
        styles[label] || styles.PENDING
      }`}
    >
      {icons[label] || icons.PENDING}
      {label}
    </span>
  );
};

// ------------------------------------------------------------
//  Komponen DetectorCard (Tailwind only)
// ------------------------------------------------------------
const DetectorCard = ({ icon: Icon, label, value, status, detail, loading }) => {
  const colorMap = {
    PASSED: 'border-emerald-500/30 bg-emerald-500/5',
    WARNING: 'border-yellow-500/30 bg-yellow-500/5',
    CRITICAL: 'border-rose-500/30 bg-rose-500/5',
    PENDING: 'border-indigo-500/30 bg-indigo-500/5',
    UNKNOWN: 'border-gray-500/30 bg-gray-500/5',
  };
  const iconColor = {
    PASSED: 'text-emerald-400',
    WARNING: 'text-yellow-400',
    CRITICAL: 'text-rose-400',
    PENDING: 'text-indigo-400',
    UNKNOWN: 'text-gray-400',
  };
  return (
    <div
      className={`p-3 rounded-lg border ${colorMap[status] || colorMap.PENDING} bg-white/5 transition-all hover:bg-white/10`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`w-3.5 h-3.5 ${iconColor[status] || iconColor.PENDING}`} />
          <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider">
            {label}
          </span>
        </div>
        <StatusBadge status={status} />
      </div>
      {loading ? (
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
          <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
          Scanning...
        </div>
      ) : (
        <>
          <div className="mt-1 font-mono text-sm text-white truncate select-all" title={value}>
            {value || '—'}
          </div>
          {detail && (
            <div className="text-[10px] text-gray-400 truncate" title={detail}>
              {detail}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ------------------------------------------------------------
//  MAIN DASHBOARD (Tailwind only – no custom CSS)
// ------------------------------------------------------------
export default function AdminDashboard() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);
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
        const stillExists = selectedReport && data.some((r) => r.id === selectedReport.id);
        if (stillExists) {
          setSelectedReport(data.find((r) => r.id === selectedReport.id));
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

  // Copy URL
  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(idx);
    setTimeout(() => setCopiedLink(null), 1500);
  };

  // Group outgoing links
  const getGroupedLinks = (links) => {
    const groups = { whatsapp: [], telegram: [], google_form: [], apk: [], other: [] };
    if (Array.isArray(links)) {
      links.forEach((link) => {
        if (groups[link.type]) groups[link.type].push(link);
        else groups.other.push(link);
      });
    }
    return groups;
  };

  const groupedLinks = selectedReport ? getGroupedLinks(selectedReport.outgoing_links) : null;

  // Simulasi data analisis (nantinya dari API)
  const getAnalysisData = (report) => {
    if (!report) return null;
    return {
      crawl_status: {
        status: report.screenshot_url ? 'PASSED' : 'PENDING',
        value: report.screenshot_url ? 'Successfully crawled' : 'Pending scan',
        detail: report.screenshot_url
          ? `Last scan: ${new Date().toLocaleString()}`
          : 'Waiting for janitor...',
      },
      ssl_certificate: {
        status: 'PASSED',
        value: 'Valid SSL Certificate',
        detail: "Issued by: Let's Encrypt R3, Expires: 2026-11-15",
      },
      dns_records: {
        status: 'PASSED',
        value: 'A: 188.114.97.0, 188.114.96.0',
        detail: 'Cloudflare DNS (CDN)',
      },
      open_ports: {
        status: 'WARNING',
        value: 'Port 80 (HTTP), 443 (HTTPS) open',
        detail: 'Port 22 (SSH) filtered',
      },
      blacklist_status: {
        status: 'PASSED',
        value: 'Not blacklisted',
        detail: 'Clean on major RBLs',
      },
      domain_age: {
        status: 'WARNING',
        value: 'Registered 45 days ago',
        detail: 'Created: 2026-06-30',
      },
      registrar_info: {
        status: 'PASSED',
        value: 'GoDaddy.com, LLC',
        detail: 'Abuse: abuse@godaddy.com',
      },
      cdn_detection: {
        status: 'WARNING',
        value: 'Cloudflare detected',
        detail: 'CDN provider: Cloudflare, Inc.',
      },
    };
  };

  const analysisData = selectedReport ? getAnalysisData(selectedReport) : null;

  const channelConfigs = [
    {
      key: 'registrar_abuse',
      icon: '📧',
      label: 'Registrar Abuse Email',
      targetLabel: 'Target',
      targetKey: 'target',
      actionLabel: 'Action',
      actionKey: 'subject',
    },
    {
      key: 'google_safe_browsing',
      icon: '🔴',
      label: 'Google Safe Browsing',
      targetLabel: 'Endpoint',
      targetKey: 'endpoint',
      actionLabel: 'Action',
      actionKey: 'action',
    },
    {
      key: 'microsoft_smartscreen',
      icon: '🪟',
      label: 'MS SmartScreen',
      targetLabel: 'Endpoint',
      targetKey: 'endpoint',
      actionLabel: 'Action',
      actionKey: 'action',
    },
    {
      key: 'mcafee_webadvisor',
      icon: '🔒',
      label: 'McAfee WebAdvisor',
      targetLabel: 'Endpoint',
      targetKey: 'endpoint',
      actionLabel: 'Action',
      actionKey: 'action',
    },
    {
      key: 'nordvpn_cybersec',
      icon: '🌐',
      label: 'NordVPN CyberSec',
      targetLabel: 'Endpoint',
      targetKey: 'endpoint',
      actionLabel: 'Action',
      actionKey: 'action',
    },
  ];

  // ------------------------------------------------------------
  //  RENDER
  // ------------------------------------------------------------
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden w-full bg-[#08090d]">
      {/* ========== TOP BAR ========== */}
      <div className="flex justify-between items-center px-6 py-3 bg-[#0a0c12] border-b border-white/5 flex-shrink-0 h-12">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
          <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>Threat Triage & Review Center</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunJanitor}
            className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold uppercase bg-indigo-500/10 border border-indigo-500/20 rounded-md text-indigo-300 hover:bg-indigo-500/20 transition"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Trigger Janitor
          </button>
          <button
            onClick={fetchPending}
            className="p-1.5 bg-white/5 border border-white/5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ========== 3 KOLOM ========== */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ---------- KOLOM KIRI (Queue) ---------- */}
        <div className="w-80 min-w-[320px] border-r border-white/5 bg-[#050608]/40 flex flex-col overflow-y-auto flex-shrink-0">
          <div className="flex justify-between items-center px-4 py-3 border-b border-white/5">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Pending Cases ({reports.length})
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              Priority Hit
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center flex-1 p-8 text-gray-400">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mb-2" />
              Loading...
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 p-8 text-gray-400">
              <ShieldCheck className="w-8 h-8 text-emerald-500/20 mb-2" />
              No Threats
            </div>
          ) : (
            reports.map((r) => (
              <div
                key={r.id}
                onClick={() => {
                  setSelectedReport(r);
                  setDispatchedChannels(null);
                }}
                className={`px-4 py-4 border-b border-white/5 border-l-4 cursor-pointer transition ${
                  selectedReport?.id === r.id
                    ? 'bg-indigo-500/10 border-l-indigo-500'
                    : 'border-l-transparent hover:bg-white/5'
                }`}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[11px] font-extrabold px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-cyan-400 uppercase">
                    {r.target_brand_raw}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-gray-400">
                    <Users className="w-3 h-3 text-cyan-400" />
                    {r.hit_count}
                  </span>
                </div>
                <div className="font-mono text-xs text-gray-400 truncate" title={r.reported_url}>
                  {r.reported_url}
                </div>
                <div className="text-[10px] text-gray-500 mt-1">
                  {r.created_at ? new Date(r.created_at).toLocaleTimeString() : 'Recent'}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ---------- KOLOM TENGAH (Forensics) ---------- */}
        <div className="flex-1 p-5 overflow-y-auto border-r border-white/5 flex flex-col gap-5 min-w-0 bg-[#08090d]">
          {selectedReport ? (
            <>
              {/* Technical Specs */}
              <div>
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Technical Specifications
                </h3>
                <div className="bg-[#0d1017]/50 border border-white/5 rounded-xl p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[10px] font-semibold text-gray-500 uppercase">
                        Server IP
                      </span>
                      <span className="font-mono text-sm text-white bg-black/40 px-2 py-1 rounded border border-white/5 inline-block select-all">
                        {selectedReport.ip_address || 'Pending Lookup'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-semibold text-gray-500 uppercase">
                        Hosting
                      </span>
                      <span className="text-sm font-semibold text-white truncate block">
                        {selectedReport.hosting_provider || 'Pending Lookup'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-[10px] font-semibold text-gray-500 uppercase">
                        Abuse Contact
                      </span>
                      <span className="font-mono text-sm text-cyan-400 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        {selectedReport.abuse_email || 'Searching registrars...'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Screenshot */}
              <div className="flex flex-col flex-1 min-h-[380px]">
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Forensic Screenshot (Mobile Viewport)
                </h3>
                <div className="flex-1 border border-white/5 rounded-xl overflow-hidden bg-[#0d0f14] flex flex-col shadow-xl">
                  <div className="h-9 bg-white/5 border-b border-white/5 flex items-center px-3 gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                    </div>
                    <div className="flex-1 ml-3 max-w-[70%] h-5 bg-black/40 border border-white/5 rounded flex items-center px-2 font-mono text-[11px] text-gray-400 truncate select-all">
                      {selectedReport.reported_url}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 bg-black/30 flex items-start justify-center">
                    {selectedReport.screenshot_url ? (
                      <img
                        src={`${API_BASE}${selectedReport.screenshot_url}`}
                        alt="Screenshot"
                        className="max-w-[280px] w-full border border-white/10 rounded shadow-2xl"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center flex-1 text-gray-400">
                        <RefreshCw className="w-8 h-8 animate-spin text-indigo-400 mb-2" />
                        Generating forensic evidence...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Detected Outgoing Links */}
              {groupedLinks && Object.values(groupedLinks).some((arr) => arr.length > 0) && (
                <div>
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Detected Outgoing Targets
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Object.entries({
                      whatsapp: { label: '💬 WhatsApp', cls: 'border-emerald-500' },
                      telegram: { label: '✈️ Telegram', cls: 'border-sky-500' },
                      google_form: { label: '📝 Credential Forms', cls: 'border-purple-500' },
                      apk: { label: '📲 APK Downloads', cls: 'border-amber-500' },
                      other: { label: '🔗 Other Redirects', cls: 'border-gray-500' },
                    }).map(([key, { label, cls }]) => {
                      const items = groupedLinks[key];
                      if (!items || items.length === 0) return null;
                      return (
                        <div
                          key={key}
                          className={`p-3 rounded-lg bg-black/30 border-l-4 ${cls} border border-white/5`}
                        >
                          <div className="text-[10px] font-bold uppercase tracking-wider mb-1">
                            {label} ({items.length})
                          </div>
                          {items.map((link, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between gap-2 text-[11px] font-mono text-gray-300 truncate"
                            >
                              <span className="truncate" title={link.url}>
                                {link.url}
                              </span>
                              <div className="flex gap-1 flex-shrink-0">
                                <button
                                  onClick={() => handleCopy(link.url, `${key}-${idx}`)}
                                  className="hover:text-white"
                                >
                                  {copiedLink === `${key}-${idx}` ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                                <a
                                  href={link.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="hover:text-white"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-gray-400 p-8">
              <Eye className="w-12 h-12 text-white/5 mb-3" />
              <h3 className="text-sm font-bold text-gray-500 uppercase">No Case Selected</h3>
              <p className="text-xs max-w-xs mt-1.5 text-center">
                Select a threat incident from the left sidebar queue to inspect forensic evidence.
              </p>
            </div>
          )}
        </div>

        {/* ---------- KOLOM KANAN (Security Analysis) ---------- */}
        <div className="w-96 min-w-[380px] p-5 overflow-y-auto bg-[#0b0d14]/40 flex flex-col gap-3 flex-shrink-0">
          {selectedReport && analysisData ? (
            <>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">
                  Technical Footprint & Security Analysis
                </h3>
              </div>
              <div className="flex flex-col gap-2">
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
              {/* Summary */}
              <div className="p-4 rounded-xl bg-black/30 border border-white/5 mt-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                    Overall Security Posture
                  </span>
                  <span className="text-xs font-bold text-yellow-400">⚠️ WARNING</span>
                </div>
                <div className="text-xs text-gray-300">6/8 checks passed, 2 warnings detected</div>
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                    ✓ SSL Valid
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                    ✓ DNS OK
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-[10px] font-bold border border-yellow-500/20">
                    ⚠ Cloudflare
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-[10px] font-bold border border-yellow-500/20">
                    ⚠ Domain New
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-gray-400 p-8">
              <Shield className="w-12 h-12 text-white/5 mb-3" />
              <h3 className="text-sm font-bold text-gray-500 uppercase">No Case Selected</h3>
              <p className="text-xs max-w-xs mt-1.5 text-center">
                Security analysis and technical footprint will appear here once a case is selected.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ========== BOTTOM ACTION BAR ========== */}
      {selectedReport && (
        <div className="h-[72px] flex items-center px-6 bg-[#0a0c12]/95 border-t border-white/5 flex-shrink-0 backdrop-blur-md">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase">
              <span>Active Case:</span>
              <span className="font-mono text-sm text-white bg-white/5 border border-white/5 px-2.5 py-1 rounded select-all">
                {selectedReport.id}
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleReject(selectedReport.id)}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase rounded border border-rose-500/25 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ShieldX className="w-4 h-4" /> Reject Report
              </button>
              <button
                onClick={() => handleApprove(selectedReport.id)}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase rounded bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ShieldCheck className="w-4 h-4" /> Approve & Send Takedown
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== DISPATCH LOGS ========== */}
      {(notification || dispatchedChannels) && (
        <div className="px-6 pb-4 bg-[#0a0c12] border-t border-white/5 flex flex-col gap-3 flex-shrink-0">
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
            <div className="p-3 bg-black/60 border border-white/5 rounded-lg font-mono text-xs text-gray-200 max-h-36 overflow-y-auto">
              <div className="text-cyan-400 font-bold border-b border-white/5 pb-1 mb-2 uppercase flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 inline" /> Multi-Vector Threat Intelligence
                Broadcast Log
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {channelConfigs.map((cfg) => {
                  const ch = dispatchedChannels[cfg.key];
                  if (!ch) return null;
                  return (
                    <div key={cfg.key} className="p-2.5 rounded bg-white/5 border border-white/10">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold">
                          {cfg.icon} {cfg.label}
                        </span>
                        <StatusBadge status={ch.status} />
                      </div>
                      {ch.target && (
                        <div className="text-gray-400">
                          {cfg.targetLabel}:{' '}
                          <span className="text-gray-200 font-mono">
                            {ch[cfg.targetKey] || ch.target}
                          </span>
                        </div>
                      )}
                      {ch.action && (
                        <div className="text-gray-400">
                          {cfg.actionLabel}:{' '}
                          <span className="text-gray-200">{ch[cfg.actionKey] || ch.action}</span>
                        </div>
                      )}
                      {ch.error && <div className="text-rose-400 text-[10px]">Error: {ch.error}</div>}
                      {ch.timestamp && (
                        <div className="text-gray-500 text-[9px] font-mono mt-1">
                          {new Date(ch.timestamp).toLocaleString()}
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