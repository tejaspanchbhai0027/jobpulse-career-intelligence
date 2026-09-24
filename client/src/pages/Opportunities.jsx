import React, { useState } from 'react';
import useOpportunities from '../hooks/useOpportunities';
import OpportunityModal from '../components/modals/OpportunityModal';

const OpportunityCard = ({ opportunity, onClick }) => {
  return (
    <div 
      onClick={() => onClick(opportunity)}
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '16px',
        padding: '24px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        height: '100%',
        position: 'relative'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--color-brand-primary)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--color-border)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {opportunity.isTracked && (
        <div style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '0.75rem', background: '#10b98120', color: '#10b981', padding: '4px 8px', borderRadius: '4px', fontWeight: 700 }}>
          Tracked
        </div>
      )}
      
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-brand-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
          {opportunity.type}
        </div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>
          {opportunity.title}
        </h3>
        <div style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
          {opportunity.company}
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          <span>📍</span> {opportunity.location} ({opportunity.workMode})
        </div>
        {opportunity.deadline && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            <span>⏳</span> Due: {new Date(opportunity.deadline).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
};

const Opportunities = () => {
  const [filters, setFilters] = useState({ type: '', workMode: '' });
  const { opportunities, loading, error, trackOpportunity } = useOpportunities(filters);
  const [selectedOpp, setSelectedOpp] = useState(null);

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="page-container" style={{ minHeight: '100vh', background: 'var(--color-bg)', padding: '32px', paddingTop: 'max(96px, env(safe-area-inset-top, 0px))', paddingBottom: '100px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header & Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>Opportunity Discovery</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', marginTop: '0.25rem' }}>
              Explore and track jobs, internships, and placement events.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <select name="type" value={filters.type} onChange={handleFilterChange} style={{ padding: '0.5rem 1rem', borderRadius: '8px', width: 'auto', background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', outline: 'none' }}>
              <option value="">All Types</option>
              <option value="Full-Time">Full-Time</option>
              <option value="Internship">Internship</option>
              <option value="Placement Drive">Placement Drive</option>
              <option value="Career Event">Career Event</option>
            </select>
            <select name="workMode" value={filters.workMode} onChange={handleFilterChange} style={{ padding: '0.5rem 1rem', borderRadius: '8px', width: 'auto', background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', outline: 'none' }}>
              <option value="">All Work Modes</option>
              <option value="On-site">On-site</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Remote">Remote</option>
            </select>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '16px', borderRadius: '12px', textAlign: 'center', fontWeight: 600 }}>
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
            <div style={{ fontSize: '1.2rem', color: 'var(--color-text-secondary)', animation: 'pulse 1.5s infinite' }}>Loading opportunities...</div>
          </div>
        ) : (
          /* Grid */
          opportunities.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {opportunities.map(opp => (
                <OpportunityCard key={opp._id} opportunity={opp} onClick={setSelectedOpp} />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div style={{ background: 'var(--color-surface)', padding: '64px', borderRadius: '18px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>No opportunities found</h3>
              <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px' }}>
                There are currently no opportunities matching your criteria. Check back later!
              </p>
            </div>
          )
        )}
      </div>

      {selectedOpp && (
        <OpportunityModal 
          opportunity={selectedOpp} 
          onClose={() => setSelectedOpp(null)} 
          onTrack={trackOpportunity}
        />
      )}
    </div>
  );
};

export default Opportunities;
