import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const StudentOffersView = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const { data } = await api.get('/offers/student');
        if (data.success) {
          setOffers(data.data);
        }
      } catch (error) {
        console.error('Failed to load offers', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading offers...</div>;

  return (
    <div style={{ padding: '2rem 0' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>My Offers & Verifications</h2>
      
      {offers.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>No offers submitted yet</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>When you receive an offer, move the application to the Offer stage and submit it for verification.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {offers.map(offer => (
            <div key={offer._id} style={{
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              borderRadius: '12px', padding: '1.5rem', position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.25rem 0', fontWeight: 800, fontSize: '1.1rem' }}>{offer.companyName}</h3>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{offer.jobRole}</div>
                </div>
                <span style={{
                  padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
                  background: offer.status === 'PENDING_REVIEW' ? 'rgba(245, 158, 11, 0.1)' : 
                              offer.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: offer.status === 'PENDING_REVIEW' ? '#d97706' : 
                         offer.status === 'APPROVED' ? '#059669' : '#dc2626'
                }}>
                  {offer.status.replace('_', ' ')}
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Package</span>
                  <span style={{ fontWeight: 600 }}>{offer.package}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Offer Date</span>
                  <span style={{ fontWeight: 600 }}>{new Date(offer.offerDate).toLocaleDateString()}</span>
                </div>
                {offer.placementDriveId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Drive</span>
                    <span style={{ fontWeight: 600, textAlign: 'right' }}>{offer.placementDriveId.title}</span>
                  </div>
                )}
              </div>
              
              {offer.rejectionReason && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.85rem' }}>
                  <strong style={{ color: '#dc2626' }}>Reason:</strong> {offer.rejectionReason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentOffersView;
