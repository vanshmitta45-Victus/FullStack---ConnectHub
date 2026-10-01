import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AuditHistory() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('ALL'); // ALL, TASK, USER, SECURITY
  const [timeRange, setTimeRange] = useState('ALL'); // ALL, TODAY, WEEK, MONTH
  const [searchQuery, setSearchQuery] = useState('');
  
  // Diff Inspector Modal state
  const [selectedLogForDiff, setSelectedLogForDiff] = useState(null);

  const token = localStorage.getItem('token');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get('/api/audit/all', {
        headers,
        params: {
          entityType: entityFilter !== 'ALL' ? entityFilter : undefined,
          timeRange: timeRange !== 'ALL' ? timeRange : undefined,
          search: searchQuery.trim() || undefined
        }
      });
      // Chronological descending (most recent first)
      setLogs([...(res.data || [])].reverse());
    } catch (err) {
      console.error('Failed to fetch audit ledger', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityFilter, timeRange]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  // Export Audit Ledger to CSV
  const handleExportCSV = () => {
    if (logs.length === 0) {
      alert('No audit logs available to export.');
      return;
    }

    const headers = ['Log ID', 'Timestamp', 'Actor', 'Action Type', 'Entity Type', 'Entity ID', 'Event Description', 'Previous State', 'New State'];
    
    const rows = logs.map(l => [
      l.id,
      `"${(l.timestamp || '').replace(/"/g, '""')}"`,
      `"${(l.actor || 'System').replace(/"/g, '""')}"`,
      `"${(l.actionType || 'SYSTEM').replace(/"/g, '""')}"`,
      `"${(l.entityType || 'GENERAL').replace(/"/g, '""')}"`,
      `"${(l.entityId || '').replace(/"/g, '""')}"`,
      `"${(l.actionLog || '').replace(/"/g, '""')}"`,
      `"${(l.previousValue || '').replace(/"/g, '""')}"`,
      `"${(l.newValue || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nexus-audit-ledger-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to format JSON for diff viewer
  const formatJson = (str) => {
    if (!str) return 'null';
    try {
      const parsed = JSON.parse(str);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return str;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '22px' }}>
      
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="neu-title" style={{ fontSize: '28px', marginBottom: '4px' }}>Compliance & Audit Ledger</h1>
          <p className="neu-subtitle">Immutable chronological event trail, entity state diffs, and compliance export.</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            className="neu-btn neu-btn-pill"
            style={{ padding: '8px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={fetchLogs}
            title="Refresh logs from database"
          >
            🔄 Refresh
          </button>

          <button
            className="neu-btn neu-btn-pill neu-btn-primary"
            style={{ padding: '8px 18px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={handleExportCSV}
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Filter Matrix Toolbar: Entity Filter Tabs + Time Range + Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        
        {/* Entity Tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'ALL', label: 'All Events', icon: '⚡' },
            { id: 'TASK', label: 'Tasks', icon: '📋' },
            { id: 'USER', label: 'Users & Roles', icon: '👤' },
            { id: 'SECURITY', label: 'Security & Auth', icon: '🛡️' }
          ].map(tab => (
            <button
              key={tab.id}
              className={`neu-btn neu-btn-pill ${entityFilter === tab.id ? 'active' : ''}`}
              style={{ padding: '7px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setEntityFilter(tab.id)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Time Range Selector & Search */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="neu-panel-inset" style={{ display: 'flex', padding: '3px', borderRadius: '14px' }}>
            {[
              { id: 'ALL', label: 'All Time' },
              { id: 'TODAY', label: 'Today' },
              { id: 'WEEK', label: '7 Days' },
              { id: 'MONTH', label: '30 Days' }
            ].map(range => (
              <button
                key={range.id}
                className={`neu-btn neu-btn-pill ${timeRange === range.id ? 'neu-btn-primary' : ''}`}
                style={{ padding: '5px 12px', fontSize: '11px', border: 'none', boxShadow: timeRange === range.id ? undefined : 'none' }}
                onClick={() => setTimeRange(range.id)}
              >
                {range.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="neu-input"
              placeholder="Filter by actor, entity (TSK-*)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '220px', padding: '7px 12px', fontSize: '12px' }}
            />
            <button type="submit" className="neu-btn neu-btn-pill" style={{ padding: '7px 12px', fontSize: '12px' }}>
              🔍
            </button>
          </form>
        </div>

      </div>

      {/* Main Ledger Table */}
      <div className="neu-panel" style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--neu-muted)' }}>
            Loading compliance ledger events...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--neu-muted)' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>📜</div>
            <h3 className="neu-title" style={{ fontSize: '16px', marginBottom: '4px' }}>No audit records found</h3>
            <p className="neu-subtitle">Try selecting a different time range or adjusting search keywords.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.5)' }}>
                <th className="neu-subtitle" style={{ padding: '14px 10px', width: '70px' }}>ID</th>
                <th className="neu-subtitle" style={{ padding: '14px 10px', width: '150px' }}>TIMESTAMP</th>
                <th className="neu-subtitle" style={{ padding: '14px 10px', width: '140px' }}>ACTOR</th>
                <th className="neu-subtitle" style={{ padding: '14px 10px', width: '130px' }}>ACTION</th>
                <th className="neu-subtitle" style={{ padding: '14px 10px', width: '110px' }}>ENTITY</th>
                <th className="neu-subtitle" style={{ padding: '14px 10px' }}>DESCRIPTION</th>
                <th className="neu-subtitle" style={{ padding: '14px 10px', textAlign: 'right', width: '100px' }}>DIFF</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => {
                const hasDiff = Boolean(log.previousValue || log.newValue);
                return (
                  <tr
                    key={log.id}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.25)', transition: 'background 0.15s' }}
                  >
                    <td style={{ padding: '14px 10px', fontSize: '12px', fontWeight: 'bold', color: 'var(--neu-muted)' }}>
                      #{log.id}
                    </td>

                    <td style={{ padding: '14px 10px', fontSize: '12px', color: 'var(--neu-text)' }}>
                      {log.timestamp || 'Recent'}
                    </td>

                    <td style={{ padding: '14px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="neu-avatar neu-avatar-sm" style={{ width: '24px', height: '24px', fontSize: '11px', fontWeight: 'bold' }}>
                          {(log.actor || 'S').charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--neu-text)' }}>
                          @{log.actor || 'System'}
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: '14px 10px' }}>
                      <span style={{
                        fontSize: '10px',
                        padding: '3px 8px',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        letterSpacing: '0.4px',
                        background:
                          log.actionType?.includes('DELETE') ? 'rgba(239, 68, 68, 0.12)' :
                          log.actionType?.includes('CREATE') ? 'rgba(34, 197, 94, 0.12)' :
                          log.actionType?.includes('STATUS') ? 'rgba(245, 158, 11, 0.12)' :
                          log.actionType?.includes('CHAT') ? 'rgba(99, 102, 241, 0.15)' : 'rgba(148, 163, 184, 0.12)',
                        color:
                          log.actionType?.includes('DELETE') ? 'var(--neu-danger)' :
                          log.actionType?.includes('CREATE') ? 'var(--neu-success)' :
                          log.actionType?.includes('STATUS') ? '#d97706' :
                          log.actionType?.includes('CHAT') ? 'var(--neu-accent)' : 'var(--neu-muted)'
                      }}>
                        {log.actionType || 'EVENT'}
                      </span>
                    </td>

                    <td style={{ padding: '14px 10px' }}>
                      {log.entityId ? (
                        <span className="badge-tag" style={{ fontSize: '11px' }}>
                          {log.entityId}
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--neu-muted)' }}>—</span>
                      )}
                    </td>

                    <td style={{ padding: '14px 10px', fontSize: '13px', color: 'var(--neu-text)' }}>
                      {log.actionLog}
                    </td>

                    <td style={{ padding: '14px 10px', textAlign: 'right' }}>
                      {hasDiff ? (
                        <button
                          className="neu-btn neu-btn-pill"
                          style={{ fontSize: '11px', padding: '4px 10px' }}
                          onClick={() => setSelectedLogForDiff(log)}
                        >
                          View Diff 🔍
                        </button>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--neu-muted)' }}>—</span>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Before / After JSON Diff Viewer Modal */}
      {selectedLogForDiff && (
        <div
          onClick={() => setSelectedLogForDiff(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(3, 6, 12, 0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-panel"
            style={{ width: '700px', maxWidth: '92vw', maxHeight: '85vh', overflowY: 'auto', padding: '32px', borderRadius: '20px' }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--neu-accent)' }}>
                    LOG #{selectedLogForDiff.id}
                  </span>
                  <span className="badge-tag">
                    {selectedLogForDiff.actionType || 'MUTATION'}
                  </span>
                  {selectedLogForDiff.entityId && (
                    <span className="badge-tag">
                      {selectedLogForDiff.entityId}
                    </span>
                  )}
                </div>
                <h2 className="neu-title" style={{ fontSize: '18px' }}>{selectedLogForDiff.actionLog}</h2>
                <p className="neu-subtitle" style={{ fontSize: '12px' }}>
                  Recorded at {selectedLogForDiff.timestamp} by @{selectedLogForDiff.actor || 'System'}
                </p>
              </div>

              <button className="neu-btn neu-btn-icon" onClick={() => setSelectedLogForDiff(null)}>✕</button>
            </div>

            {/* Before / After Side-by-Side Diff Comparison */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              
              {/* Previous State */}
              <div className="neu-panel-inset" style={{ padding: '16px', borderRadius: '14px', borderLeft: '4px solid var(--neu-danger)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--neu-danger)' }}>
                    PREVIOUS STATE
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--neu-muted)' }}>Before mutation</span>
                </div>
                <pre style={{
                  margin: 0,
                  fontSize: '12px',
                  fontFamily: 'Consolas, Monaco, monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  color: 'var(--neu-text)',
                  lineHeight: '1.4'
                }}>
                  {formatJson(selectedLogForDiff.previousValue)}
                </pre>
              </div>

              {/* New State */}
              <div className="neu-panel-inset" style={{ padding: '16px', borderRadius: '14px', borderLeft: '4px solid var(--neu-success)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--neu-success)' }}>
                    NEW STATE
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--neu-muted)' }}>After mutation</span>
                </div>
                <pre style={{
                  margin: 0,
                  fontSize: '12px',
                  fontFamily: 'Consolas, Monaco, monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  color: 'var(--neu-text)',
                  lineHeight: '1.4'
                }}>
                  {formatJson(selectedLogForDiff.newValue)}
                </pre>
              </div>

            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="neu-btn neu-btn-pill neu-btn-primary"
                style={{ padding: '8px 24px', fontSize: '13px' }}
                onClick={() => setSelectedLogForDiff(null)}
              >
                Close Inspector
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default AuditHistory;
