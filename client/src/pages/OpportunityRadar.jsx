import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import OpportunityCard from '../components/opportunities/OpportunityCard';
import OpportunityDetailsModal from '../components/opportunities/OpportunityDetailsModal';
import Toast from '../components/ui/Toast';

const OpportunityRadar = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOpp, setSelectedOpp] = useState(null);
  
  // Toasts
  const [toasts, setToasts] = useState([]);
  const addToast = (title, message, type = 'info') => {
    setToasts(prev => [...prev, { id: Date.now(), title, message, type }]);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // Filters
  const [filterType, setFilterType] = useState('All');
  const [filterSort, setFilterSort] = useState('Best Match');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const res = await api.get('/opportunities/recommended');
      if (res.data.success) {
        setOpportunities(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch recommended opportunities:', err);
      setError('Could not load Opportunity Radar right now.');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort logic
  let filtered = [...opportunities];

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(o => 
      o.title?.toLowerCase().includes(q) || 
      o.company?.toLowerCase().includes(q)
    );
  }

  if (filterType !== 'All') {
    if (filterType === 'Eligible Only') {
      filtered = filtered.filter(o => o.isEligible);
    } else if (filterType === 'Wishlist') {
      filtered = filtered.filter(o => o.isWishlisted);
    } else {
      filtered = filtered.filter(o => o.type === filterType);
    }
  }

  if (filterSort === 'Best Match') {
    filtered.sort((a, b) => (b.match?.score || 0) - (a.match?.score || 0));
  } else if (filterSort === 'Newest') {
    filtered.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
  } else if (filterSort === 'Deadline Soon') {
    filtered.sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    });
  }

  const getStats = () => {
    return {
      total: opportunities.length,
      highMatch: opportunities.filter(o => o.match?.score >= 80).length,
      newThisWeek: opportunities.filter(o => {
        if(!o.postedDate) return false;
        const days = (new Date() - new Date(o.postedDate)) / (1000 * 60 * 60 * 24);
        return days <= 7;
      }).length,
      closingSoon: opportunities.filter(o => {
        if(!o.deadline) return false;
        const days = (new Date(o.deadline) - new Date()) / (1000 * 60 * 60 * 24);
        return days >= 0 && days <= 5;
      }).length
    };
  };

  const stats = getStats();

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', minHeight: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
          Opportunity Radar
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>
          Discover opportunities that match your skills, resume, career goals, and placement eligibility.
        </p>
      </div>

      {/* Stats row */}
      {!loading && opportunities.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Recommended Opportunities', value: stats.total, color: 'var(--color-brand-primary)' },
            { label: 'High Match Opportunities', value: stats.highMatch, color: 'var(--color-success)' },
            { label: 'New This Week', value: stats.newThisWeek, color: '#3b82f6' },
            { label: 'Closing Soon', value: stats.closingSoon, color: 'var(--color-warning)' }
          ].map((stat, i) => (
            <div key={i} style={{ 
              background: 'var(--color-surface)', padding: '20px', borderRadius: '16px', border: '1px solid var(--color-border)',
              display: 'flex', flexDirection: 'column', gap: '8px'
            }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{stat.label}</span>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: stat.color }}>{stat.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ 
        display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', 
        alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--color-surface)', padding: '16px', borderRadius: '16px', border: '1px solid var(--color-border)'
      }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
          <input 
            type="text" 
            placeholder="Search role or company..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ 
              background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', 
              color: 'var(--color-text-primary)', padding: '10px 16px', borderRadius: '8px', flex: '1', minWidth: '200px'
            }} 
          />
          
          <select 
            value={filterType} onChange={e => setFilterType(e.target.value)}
            style={{ 
              background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', 
              color: 'var(--color-text-primary)', padding: '10px 16px', borderRadius: '8px'
            }}
          >
            <option value="All">All Types</option>
            <option value="Eligible Only">Eligible Only</option>
            <option value="Wishlist">Wishlisted</option>
            <option value="Full-Time">Full-Time</option>
            <option value="Internship">Internship</option>
            <option value="Placement Drive">Placement Drive</option>
          </select>

          <select 
            value={filterSort} onChange={e => setFilterSort(e.target.value)}
            style={{ 
              background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', 
              color: 'var(--color-text-primary)', padding: '10px 16px', borderRadius: '8px'
            }}
          >
            <option value="Best Match">Sort by: Best Match</option>
            <option value="Newest">Sort by: Newest</option>
            <option value="Deadline Soon">Sort by: Deadline Soon</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ height: '240px', background: 'var(--color-surface)', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : error ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-error)', background: 'var(--color-error)10', borderRadius: '16px' }}>
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', background: 'var(--color-surface)', borderRadius: '16px', border: '1px dashed var(--color-border)' }}>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
            We couldn't find strong matches right now.
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
            Try updating your profile or uploading a resume to improve your recommendations.
          </p>
          <a href="/resume" style={{ 
            background: 'var(--color-brand-primary)', color: '#000', padding: '10px 24px', 
            borderRadius: '8px', textDecoration: 'none', fontWeight: 600, display: 'inline-block' 
          }}>
            Upload Resume
          </a>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
          {filtered.map(opp => (
            <OpportunityCard key={opp._id} opp={opp} onClick={() => setSelectedOpp(opp)} />
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedOpp && (
        <OpportunityDetailsModal 
          opp={selectedOpp} 
          onClose={() => setSelectedOpp(null)} 
          onUpdate={fetchOpportunities}
          addToast={addToast}
        />
      )}
      
      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};

export default OpportunityRadar;
