import React from 'react';
import { X, Clock, AlertTriangle, CheckCircle, ShieldAlert, Users, Lock, Globe, AlertOctagon, Calendar, RefreshCw } from 'lucide-react';

// Compact, public-safe version of the admin dashboard's forensic detector
// cards. Only shows non-sensitive fields (no abuse email, no registrar
// contact info) - just enough real data so the modal doesn't read like a
// vague placeholder message.
const statusDot = {
  PASSED: 'bg-emerald-400',
  CLEAN: 'bg-emerald-400',
  WARNING: 'bg-yellow-400',
  CRITICAL: 'bg-rose-400',
  UNKNOWN: 'bg-gray-500',
  PENDING: 'bg-indigo-400 animate-pulse'
};

const MiniStat = ({ icon: Icon, label, value, status, loading }) => (
  <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5">
    <div className="flex items-center gap-2 min-w-0">
      <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
      <span className="text-[11px] text-gray-400 truncate">{label}</span>
    </div>
    <div className="flex items-center gap-1.5 flex-shrink-0">
      {loading ? (
        <>
          <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
          <span className="text-[11px] text-gray-500">Scanning...</span>
        </>
      ) : (
        <>
          <span className={`w-1.5 h-1.5 rounded-full ${statusDot[status] || statusDot.UNKNOWN}`} />
          <span className="text-[11px] font-mono text-gray-200 max-w-[140px] truncate" title={value}>{value}</span>
        </>
      )}
    </div>
  </div>
);

function ForensicMiniGrid({ report }) {
  if (!report) return null;
  const isScanned = !!report.last_checked_at;

  const ssl = {
    status: report.ssl_status || (isScanned ? 'UNKNOWN' : 'PENDING'),
    value: report.ssl_status === 'CRITICAL' || report.ssl_status === 'UNKNOWN'
      ? 'No valid cert'
      : report.ssl_issuer ? `Valid (${report.ssl_issuer})` : '—'
  };
  const domainAge = {
    status: report.domain_age_days != null ? (report.domain_age_days < 90 ? 'WARNING' : 'PASSED') : (isScanned ? 'UNKNOWN' : 'PENDING'),
    value: report.domain_age_days != null ? `${report.domain_age_days} days old` : 'Unknown'
  };
  const blacklist = {
    status: report.blacklist_status || (isScanned ? 'UNKNOWN' : 'PENDING'),
    value: report.blacklist_status === 'CRITICAL' ? 'Listed (URLhaus)' : report.blacklist_status === 'PASSED' ? 'Not blacklisted' : '—'
  };
  const gsb = {
    status: report.gsb_status || (isScanned ? 'UNKNOWN' : 'PENDING'),
    value: report.gsb_status === 'FLAGGED' ? 'Flagged by Google' : report.gsb_status === 'CLEAN' ? 'Clean' : '—'
  };

  return (
    <div className="w-full grid grid-cols-2 gap-2 mb-5 text-left">
      <MiniStat icon={Lock} label="SSL Certificate" {...ssl} loading={!isScanned} />
      <MiniStat icon={Calendar} label="Domain Age" {...domainAge} loading={!isScanned} />
      <MiniStat icon={AlertOctagon} label="Blacklist" {...blacklist} loading={!isScanned} />
      <MiniStat icon={Globe} label="Google Safe Browsing" {...gsb} loading={!isScanned} />
    </div>
  );
}

export default function StatusModal({ isOpen, onClose, reportData }) {
  if (!isOpen || !reportData) return null;

  const { reported_url, target_brand_raw, status, hit_count } = reportData;

  const getStatusDetails = () => {
    switch (status) {
      case 'PENDING':
        return {
          icon: <Clock className="w-12 h-12 text-amber-500 animate-pulse" />,
          title: 'Analysis in Progress',
          message: `This threat vector is already undergoing forensic analysis. Our scrapers are gathering screenshot evidence and infrastructure metadata.`
        };
      case 'APPROVED':
        return {
          icon: <AlertTriangle className="w-12 h-12 text-rose-500" />,
          title: 'Threat Confirmed — Takedown Underway',
          message: `This site has been verified as an active phishing page targeting "${target_brand_raw}". Takedown requests have been dispatched to the relevant network hosts.`
        };
      case 'COMPLETED':
        return {
          icon: <CheckCircle className="w-12 h-12 text-emerald-500" />,
          title: 'Successfully Deactivated',
          message: `This phishing node has been taken offline. Threat mitigated.`
        };
      case 'REJECTED':
        return {
          icon: <ShieldAlert className="w-12 h-12 text-gray-500" />,
          title: 'Report Dismissed',
          message: `Forensic review determined that this URL is either inactive, safe, or does not pose an anti-phishing threat.`
        };
      default:
        return {
          icon: <Clock className="w-12 h-12 text-indigo-500" />,
          title: 'Case Under Review',
          message: 'The submitted URL has been added to our triage pipeline.'
        };
    }
  };

  const details = getStatusDetails();

  return (
    <div className="modal-overlay">
      <div className="status-modal-card">
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="modal-close-btn"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Status Icon */}
        <div className="modal-icon-container">
          {details.icon}
        </div>
        
        {/* Status Heading */}
        <h3 className="modal-heading">
          {details.title}
        </h3>
        
        {/* Monospace URL Box */}
        <div className="modal-url-box">
          {reported_url}
        </div>

        {/* Details message */}
        <p className="modal-message">
          {details.message}
        </p>

        {/* Real forensic stats - so this isn't just a vague status paragraph */}
        {(status === 'PENDING' || status === 'APPROVED') && (
          <ForensicMiniGrid report={reportData} />
        )}

        {/* Hit/Contributor count badge */}
        <div className="modal-badge">
          <Users className="modal-badge-icon w-3.5 h-3.5" />
          <span>Reported by {hit_count} contributor(s)</span>
        </div>

        {/* Close button */}
        <button 
          onClick={onClose}
          className="modal-action-btn"
        >
          Close & Go Back
        </button>
      </div>
    </div>
  );
}
