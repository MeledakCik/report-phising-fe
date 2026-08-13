import React, { useState } from 'react';
import { Shield, Eye, Send } from 'lucide-react';
import PublicForm from './components/PublicForm';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [view, setView] = useState('public'); // 'public' or 'admin'

  return (
    <div className="app-container">
      {/* Top Header Navigation */}
      <header className="app-header">
        <div className="logo-section">
          <Shield className="w-5 h-5 text-indigo-400" />
          <span className="logo-text">
            ANTI-PHISHING <span className="logo-accent">HUB</span>
          </span>
        </div>

        {/* View Toggle Controller */}
        <div className="view-toggle-container">
          <button
            onClick={() => setView('public')}
            className={`view-toggle-btn ${view === 'public' ? 'active' : ''}`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Report Threat</span>
          </button>
          
          <button
            onClick={() => setView('admin')}
            className={`view-toggle-btn ${view === 'admin' ? 'active' : ''}`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Admin Console</span>
          </button>
        </div>
      </header>

      {/* Main Viewport Area */}
      <main className="main-viewport">
        {view === 'public' ? (
          <PublicForm />
        ) : (
          <AdminDashboard />
        )}
      </main>
    </div>
  );
}
