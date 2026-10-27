import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Toast from '../../components/ui/Toast';

const OfficerOfferVerifications = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [rejectModal, setRejectModal] = useState({ open: false, offerId: null, reason: '' });

  const addToast = (title, message, type = 'info') => {
    setToasts(prev => [...prev, { id: Date.now().toString(), title, message, type, duration: 4000 }]);
  };

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const fetchOffers = async () => {
    try {
      const { data } = await api.get('/offers/officer/pending');
      if (data.success) {
        setOffers(data.data);
      }
    } catch (err) {
      addToast('Error', 'Failed to fetch pending offers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to verify this offer? The student will be marked as PLACED.')) return;
    try {
      const { data } = await api.patch(`/offers/officer/${id}/approve`);
      if (data.success) {
        addToast('Offer Verified', 'The offer has been verified successfully', 'success');
        setOffers(prev => prev.filter(o => o._id !== id));
      }
    } catch (err) {
      addToast('Error', err.response?.data?.message || 'Failed to approve offer', 'error');
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectModal.reason) return;
    try {
      const { data } = await api.patch(`/offers/officer/${rejectModal.offerId}/reject`, {
        rejectionReason: rejectModal.reason
      });
      if (data.success) {
        addToast('Offer Rejected', 'The offer has been rejected', 'success');
        setOffers(prev => prev.filter(o => o._id !== rejectModal.offerId));
        setRejectModal({ open: false, offerId: null, reason: '' });
      }
    } catch (err) {
      addToast('Error', err.response?.data?.message || 'Failed to reject offer', 'error');
    }
  };

  const handleDownloadProof = async (offer) => {
    try {
      if (offer.proofFileUrl && offer.proofFileUrl.startsWith('http')) {
        window.open(offer.proofFileUrl, '_blank');
        return;
      }
      
      const response = await api.get(`/offers/${offer._id}/proof`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${offer.studentId?.name || 'student'}_${offer.proofType || 'proof'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      addToast('Error', 'Failed to download proof document', 'error');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>Offer Verifications</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>Review and verify your students' placement offers.</p>

      {loading ? (
        <div>Loading pending offers...</div>
      ) : offers.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎉</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>No pending offers</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>You're all caught up! No student offers are pending your review.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {offers.map(offer => (
            <div key={offer._id} style={{
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}>{offer.companyName}</h3>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>{offer.jobRole}</div>
                  {offer.placementDriveId && (
                    <div style={{ marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--color-brand-primary)' }}>
                      Via Drive: {offer.placementDriveId.title}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-success)' }}>{offer.package}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                    Offered: {new Date(offer.offerDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div style={{ padding: '1rem', background: 'var(--color-surface-overlay)', borderRadius: '8px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.9rem' }}>
                  <strong style={{ color: 'var(--color-text-primary)' }}>Student:</strong> {offer.studentId.name} ({offer.studentId.studentId})
                </div>
                <div style={{ fontSize: '0.9rem' }}>
                  <strong style={{ color: 'var(--color-text-primary)' }}>Department:</strong> {offer.studentId.department}
                </div>
                <div style={{ fontSize: '0.9rem' }}>
                  <strong style={{ color: 'var(--color-text-primary)' }}>Proof Document:</strong>{' '}
                  <button onClick={() => handleDownloadProof(offer)} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-brand-primary)', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.9rem' }}>
                    View / Download {offer.proofType}
                  </button>
                </div>
                {offer.notes && (
                  <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', fontStyle: 'italic', color: 'var(--color-text-secondary)' }}>
                    " {offer.notes} "
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button
                  onClick={() => handleApprove(offer._id)}
                  style={{
                    flex: 1, padding: '0.75rem', background: 'var(--color-success)', color: 'white',
                    border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Verify Offer
                </button>
                <button
                  onClick={() => setRejectModal({ open: true, offerId: offer._id, reason: '' })}
                  style={{
                    flex: 1, padding: '0.75rem', background: 'transparent', color: 'var(--color-danger)',
                    border: '1px solid var(--color-danger)', borderRadius: '8px', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--color-surface)', width: '100%', maxWidth: '400px', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Reject Offer Claim</h3>
            <form onSubmit={handleReject}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Reason for Rejection (Required)</label>
              <textarea
                value={rejectModal.reason}
                onChange={e => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface-overlay)', color: 'var(--color-text-primary)', outline: 'none', marginBottom: '1rem', resize: 'vertical', minHeight: '80px', boxSizing: 'border-box' }}
                placeholder="E.g., Proof document is unclear..."
                required
              ></textarea>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => setRejectModal({ open: false, offerId: null, reason: '' })} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text-primary)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '0.75rem', background: 'var(--color-danger)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Reject Claim</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </div>
  );
};

export default OfficerOfferVerifications;
