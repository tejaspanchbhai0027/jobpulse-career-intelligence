import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmModal from '../../components/ui/ConfirmModal';

const CATEGORY_META = {
  'HIGH ATTENTION': {
    emoji: '🔴',
    color: 'var(--color-danger)',
    bg: 'rgba(220, 38, 38, 0.08)',
    border: 'rgba(220, 38, 38, 0.25)',
    label: 'HIGH ATTENTION',
  },
  'WATCH': {
    emoji: '🟠',
    color: '#D97706',
    bg: 'rgba(217, 119, 6, 0.08)',
    border: 'rgba(217, 119, 6, 0.25)',
    label: 'WATCH',
  },
  'SKILL GAP': {
    emoji: '🟡',
    color: '#CA8A04',
    bg: 'rgba(202, 138, 4, 0.08)',
    border: 'rgba(202, 138, 4, 0.25)',
    label: 'SKILL GAP',
  },
};

const AdminInterventions = () => {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, action: '' });

  const fetchSignals = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/interventions');
      if (res.data.success) {
        setSignals(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load intervention signals.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSignals(); }, [fetchSignals]);

  const executeAction = async () => {
    const { id, action } = confirmModal;
    if (!id || !action) return;

    try {
      const status = action === 'dismiss' ? 'DISMISSED' : 'REVIEWED';
      await api.patch(`/admin/interventions/${id}/status`, { status });
      setSignals(prev => prev.filter(s => s._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} intervention`);
    } finally {
      setConfirmModal({ isOpen: false, id: null, action: '' });
    }
  };

  const grouped = {
    'HIGH ATTENTION': signals.filter(s => s.category === 'HIGH ATTENTION'),
    'WATCH': signals.filter(s => s.category === 'WATCH'),
    'SKILL GAP': signals.filter(s => s.category === 'SKILL GAP'),
  };

  const totalCount = signals.length;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

      {error && (
        <div style={{ background: 'rgba(220, 38, 38, 0.1)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 500 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>
          Evaluating student activity patterns...
        </div>
      ) : totalCount === 0 ? (
        <EmptyState 
          icon="✅" 
          title="All Clear!" 
          description="No active intervention signals for your student cohort." 
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {Object.entries(grouped).map(([category, categorySignals]) => {
            if (categorySignals.length === 0) return null;
            const meta = CATEGORY_META[category];

            return (
              <section key={category}>
                {/* Category Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '1.25rem' }}>{meta.emoji}</span>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: meta.color, margin: 0, letterSpacing: '0.03em' }}>
                    {meta.label}
                  </h2>
                  <span style={{
                    background: meta.bg,
                    color: meta.color,
                    border: `1px solid ${meta.border}`,
                    padding: '2px 10px',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    fontWeight: 700
                  }}>
                    {categorySignals.length}
                  </span>
                </div>

                {/* Signal Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {categorySignals.map(signal => (
                    <SignalCard
                      key={signal._id}
                      signal={signal}
                      meta={meta}
                      setConfirmModal={setConfirmModal}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
      
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.action === 'dismiss' ? 'Dismiss Intervention' : 'Mark as Reviewed'}
        message={confirmModal.action === 'dismiss' ? 'Are you sure you want to dismiss this signal?' : 'Mark this signal as reviewed?'}
        confirmText={confirmModal.action === 'dismiss' ? 'Dismiss' : 'Mark Reviewed'}
        isDestructive={confirmModal.action === 'dismiss'}
        onConfirm={executeAction}
        onCancel={() => setConfirmModal({ isOpen: false, id: null, action: '' })}
      />
    </div>
  );
};

// ── SIGNAL CARD ─────────────────────────────────────────────────

const SignalCard = ({ signal, meta, setConfirmModal }) => {
  const [showEvidence, setShowEvidence] = useState(false);

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderLeft: `4px solid ${meta.color}`,
      borderRadius: '12px',
      padding: '1.75rem',
      boxShadow: 'var(--shadow-card)',
      transition: 'opacity 0.3s ease',
    }}>
      {/* Student Identity */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
            {signal.student?.name || 'Unknown Student'}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            {signal.student?.department || 'No Department'} • Batch of {signal.student?.batch || '?'} • {signal.student?.email}
          </div>
        </div>
        <Link
          to={`/admin/students/${signal.student?._id}`}
          style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-brand-primary)',
            padding: '8px 16px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '0.9rem',
            fontWeight: 700,
            whiteSpace: 'nowrap'
          }}
        >
          Review Student →
        </Link>
      </div>

      {/* Signal Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>WHAT?</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.4 }}>{signal.title}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>WHY?</div>
          <div style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>{signal.reason}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>SUGGESTED SUPPORT</div>
          <div style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>{signal.suggestedSupport}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
            EVIDENCE
            <button
              onClick={() => setShowEvidence(!showEvidence)}
              style={{ background: 'none', border: 'none', color: 'var(--color-brand-primary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, marginLeft: '0.5rem', padding: 0 }}
            >
              {showEvidence ? '[hide]' : '[show]'}
            </button>
          </div>
          {showEvidence ? (
            <div style={{
              background: 'var(--color-bg)',
              borderLeft: '2px solid var(--color-border)',
              padding: '0.5rem 0.75rem',
              borderRadius: '0 4px 4px 0',
              fontSize: '0.9rem',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.5
            }}>
              {signal.evidence}
            </div>
          ) : (
            <div style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)' }}>
              {signal.evidence}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
        <button
          onClick={() => {
            setConfirmModal({ isOpen: true, id: signal._id, action: 'review' });
          }}
          style={{
            background: 'rgba(22, 163, 74, 0.1)',
            border: '1px solid rgba(22, 163, 74, 0.3)',
            color: 'var(--color-success)',
            padding: '8px 18px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 700,
            transition: 'opacity 0.2s'
          }}
        >
          ✓ Mark Reviewed
        </button>
        <button
          onClick={() => {
            setConfirmModal({ isOpen: true, id: signal._id, action: 'dismiss' });
          }}
          style={{
            background: 'transparent',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)',
            padding: '8px 18px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 700,
            transition: 'opacity 0.2s'
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default AdminInterventions;
