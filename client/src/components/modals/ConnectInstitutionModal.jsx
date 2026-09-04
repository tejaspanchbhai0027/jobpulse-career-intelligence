import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';

const ConnectInstitutionModal = ({ isOpen, onClose }) => {
  const { updateUser } = useAuth();
  const [step, setStep] = useState(1);
  
  const [form, setForm] = useState({
    institutionCode: '',
    institutionId: '',
    placementOfficerId: '',
    mentorId: ''
  });

  const [institutionName, setInstitutionName] = useState('');
  const [officers, setOfficers] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const fetchPlacementOfficers = async (instId) => {
    try {
      const { data } = await api.get(`/auth/institutions/${instId}/placement-officers`);
      setOfficers(data.data || []);
    } catch (err) {
      setError('Failed to load placement officers');
    }
  };

  const fetchMentors = async (poId) => {
    try {
      const { data } = await api.get(`/auth/placement-officers/${poId}/mentors`);
      setMentors(data.data || []);
    } catch (err) {
      setError('Failed to load mentors');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    if (name === 'placementOfficerId') {
      fetchMentors(value);
      setForm(prev => ({ ...prev, mentorId: '' }));
    }
  };

  const validateInstitution = async (e) => {
    e.preventDefault();
    if (!form.institutionCode) return setError('Please enter an institution code');
    
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/auth/institutions/validate?code=${form.institutionCode}`);
      if (data.success && data.data) {
        setInstitutionName(data.data.name);
        setForm(prev => ({ ...prev, institutionId: data.data._id }));
        await fetchPlacementOfficers(data.data._id);
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid Institution Code.');
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep2 = (e) => {
    e.preventDefault();
    if (!form.placementOfficerId) return setError('Please select a Placement Officer');
    setStep(3);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.mentorId) return setError('Please select a Mentor');
    
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/connect-institution', {
        institutionId: form.institutionId,
        placementOfficerId: form.placementOfficerId,
        mentorId: form.mentorId
      });
      
      updateUser({
        institutionId: data.user.institutionId,
        placementOfficerId: data.user.placementOfficerId,
        mentorId: data.user.mentorId
      });
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setStep(1);
        setForm({ institutionCode: '', institutionId: '', placementOfficerId: '', mentorId: '' });
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputStyle = {
    width: '100%', padding: '0.75rem 1rem', background: 'var(--color-surface-overlay)',
    border: '1px solid var(--color-border)', borderRadius: '10px',
    color: 'var(--color-text-primary)', fontSize: '0.95rem', outline: 'none',
    transition: 'var(--transition)', boxSizing: 'border-box',
  };
  const onFocus = e => { e.target.style.borderColor = 'var(--color-brand-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)' };
  const onBlur  = e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none' };

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem', animation: 'fade-in 0.15s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%', maxWidth: '460px',
          animation: 'slide-up 0.2s ease', position: 'relative',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.5rem 1.75rem', borderBottom: '1px solid var(--color-border)',
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.15rem' }}>
              Connect Institution
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Join your university or bootcamp network
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading || success}
            style={{
              background: 'var(--color-surface-overlay)', border: '1px solid var(--color-border)',
              borderRadius: '8px', width: '32px', height: '32px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--color-text-secondary)', transition: 'var(--transition)',
              opacity: (loading || success) ? 0.5 : 1
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '1.75rem' }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-success)', marginBottom: '0.5rem' }}>Successfully Connected!</h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>You are now linked to {institutionName}. Redirecting...</p>
            </div>
          ) : (
            <>
              {error && (
                <div style={{ padding: '0.85rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '10px', color: '#fca5a5', fontSize: '0.875rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>⚠️</span> {error}
                </div>
              )}

              {step === 1 && (
                <form onSubmit={validateInstitution} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.4rem', letterSpacing: '0.03em' }}>INSTITUTION CODE</label>
                    <input id="institution-code" type="text" name="institutionCode" value={form.institutionCode} onChange={handleChange} placeholder="e.g. JP-ABC-2026" required style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                  <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '0.875rem', marginTop: '0.5rem', opacity: loading ? 0.7 : 1 }}>
                    {loading ? 'Validating...' : 'Next →'}
                  </button>
                </form>
              )}

              {step === 2 && (
                <form onSubmit={handleNextStep2} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                  <div style={{ padding: '0.75rem', background: 'var(--color-surface-overlay)', borderRadius: '8px', border: '1px solid var(--color-border)', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Connecting to</div>
                    <div style={{ fontSize: '1rem', color: 'var(--color-brand-primary)', fontWeight: 800 }}>{institutionName}</div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.4rem', letterSpacing: '0.03em' }}>PLACEMENT OFFICER</label>
                    <select name="placementOfficerId" value={form.placementOfficerId} onChange={handleChange} required style={inputStyle} onFocus={onFocus} onBlur={onBlur}>
                      <option value="" disabled>Select Placement Officer</option>
                      {officers.map(off => <option key={off._id} value={off._id}>{off.name}</option>)}
                    </select>
                    {officers.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--color-danger)', marginTop: '0.5rem' }}>No Placement Officers found.</p>}
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <button type="button" onClick={() => setStep(1)} style={{ width: '30%', padding: '0.875rem', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', borderRadius: '10px', cursor: 'pointer' }}>Back</button>
                    <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.875rem' }}>Next →</button>
                  </div>
                </form>
              )}

              {step === 3 && (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.4rem', letterSpacing: '0.03em' }}>MENTOR</label>
                    <select name="mentorId" value={form.mentorId} onChange={handleChange} required style={inputStyle} onFocus={onFocus} onBlur={onBlur}>
                      <option value="" disabled>Select your Mentor</option>
                      {mentors.map(men => <option key={men._id} value={men._id}>{men.name}</option>)}
                    </select>
                    {mentors.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--color-danger)', marginTop: '0.5rem' }}>No mentors available.</p>}
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <button type="button" onClick={() => setStep(2)} style={{ width: '30%', padding: '0.875rem', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', borderRadius: '10px', cursor: 'pointer' }}>Back</button>
                    <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1, padding: '0.875rem', opacity: loading ? 0.7 : 1 }}>
                      {loading ? 'Connecting...' : 'Connect'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConnectInstitutionModal;
