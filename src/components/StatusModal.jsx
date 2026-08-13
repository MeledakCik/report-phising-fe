import React from 'react';
import { X, Clock, AlertTriangle, CheckCircle, ShieldAlert, Users } from 'lucide-react';

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
