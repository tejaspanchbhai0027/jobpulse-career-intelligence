import React, { useState } from 'react';
import api from '../../api/axios';

const JDMatchWidget = () => {
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [error, setError] = useState('');

  const handleMatch = async () => {
    if (!jobDescription.trim()) return;
    setLoading(true);
    setError('');
    setMatchResult(null);

    try {
      const res = await api.post('/ai/match-resume', { jobDescription });
      if (res.data.success) {
        setMatchResult(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze JD against your resume.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.5rem', marginTop: '1.5rem' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-text-primary)' }}>Job Description Match</h3>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
        Paste a job description below to see how well your default resume matches the requirements. JobPulse AI will analyze skills, experience, and highlight missing keywords.
      </p>

      <textarea
        placeholder="Paste job description here..."
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
        rows={6}
        style={{
          width: '100%',
          padding: '1rem',
          background: 'var(--color-surface-overlay)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          color: 'var(--color-text-primary)',
          fontSize: '0.95rem',
          outline: 'none',
          resize: 'vertical',
          marginBottom: '1rem',
          fontFamily: 'inherit'
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        <button
          onClick={handleMatch}
          disabled={loading || !jobDescription.trim()}
          style={{
            background: 'var(--gradient-brand)',
            color: '#fff',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            fontWeight: 700,
            cursor: (loading || !jobDescription.trim()) ? 'not-allowed' : 'pointer',
            opacity: (loading || !jobDescription.trim()) ? 0.7 : 1,
            transition: 'var(--transition)'
          }}
        >
          {loading ? 'Analyzing Match...' : 'Analyze Match'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', borderRadius: '8px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {matchResult && (
        <div style={{ animation: 'fade-in 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="80" height="80" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-surface-overlay)" strokeWidth="10" />
                <circle cx="50" cy="50" r="45" fill="none" stroke={matchResult.score >= 80 ? 'var(--color-success)' : matchResult.score >= 60 ? 'var(--color-warning)' : 'var(--color-danger)'} strokeWidth="10" strokeDasharray={`${matchResult.score * 2.83} 283`} style={{ transition: 'stroke-dasharray 1s ease' }} />
              </svg>
              <div style={{ position: 'absolute', fontSize: '1.5rem', fontWeight: 800 }}>{matchResult.score}</div>
            </div>
            <div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.25rem' }}>Match Score</h4>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Based on skills, experience, and requirements fit.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', '@media (minWidth: 768px)': { gridTemplateColumns: '1fr 1fr' } }} className="md:grid-cols-2">
            
            {/* Matching Skills */}
            <div style={{ background: 'var(--color-surface-overlay)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <h5 style={{ color: 'var(--color-success)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Matching Skills
              </h5>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {matchResult.matchingSkills?.length > 0 ? matchResult.matchingSkills.map((skill, i) => (
                  <span key={i} style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                    {skill}
                  </span>
                )) : <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No matching skills found.</span>}
              </div>
            </div>

            {/* Missing Skills */}
            <div style={{ background: 'var(--color-surface-overlay)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <h5 style={{ color: 'var(--color-danger)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                Missing Keywords
              </h5>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {matchResult.missingSkills?.length > 0 ? matchResult.missingSkills.map((skill, i) => (
                  <span key={i} style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                    {skill}
                  </span>
                )) : <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No missing skills!</span>}
              </div>
            </div>

          </div>

          {/* Recommendations */}
          {matchResult.recommendations && matchResult.recommendations.length > 0 && (
            <div style={{ marginTop: '1.5rem', background: 'var(--color-surface-overlay)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <h5 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-brand-primary)' }}>Tailoring Recommendations</h5>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                {matchResult.recommendations.map((rec, i) => (
                  <li key={i} style={{ marginBottom: '0.5rem' }}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JDMatchWidget;
