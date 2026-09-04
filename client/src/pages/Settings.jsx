import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import api from '../api/axios';
import Toast from '../components/ui/Toast';

const Settings = () => {
  const { user, login } = useAuth(); // login function can update local user context if we pass the new user obj
  const [activeTab, setActiveTab] = useState('profile');
  const [toasts, setToasts] = useState([]);
  
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Resume specific state
  const [resumes, setResumes] = useState([]);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Institution connection state
  const [instForm, setInstForm] = useState({ institutionCode: '', placementOfficerId: '', mentorId: '', institutionId: '' });
  const [instName, setInstName] = useState('');
  const [instOfficers, setInstOfficers] = useState([]);
  const [instMentors, setInstMentors] = useState([]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        location: user.location || '',
        linkedinUrl: user.linkedinUrl || '',
        githubUrl: user.githubUrl || '',
        portfolioUrl: user.portfolioUrl || '',
        professionalBio: user.professionalBio || '',
        
        targetRoles: user.targetRoles?.join(', ') || '',
        targetSalary: user.targetSalary || '',
        workPreference: user.workPreference || 'Any',
        
        followUpWindowDays: user.followUpWindowDays || 7,
        emailNotifications: user.emailNotifications ?? true,
        deadlineReminders: user.deadlineReminders ?? true,
        interviewReminders: user.interviewReminders ?? true,
        
        intelligenceSettings: user.intelligenceSettings || {
          careerIntelligence: true,
          copilot: true,
          strategyRecommendations: true,
          weeklyStrategySummary: true
        },
        privacySettings: user.privacySettings || {
          shareProfileWithPlacement: true,
          applicationProgress: true,
          interviewProgress: true,
          skills: true,
          resume: false,
          salary: false,
          careerPreferences: true
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'resume') {
      fetchResumes();
    }
  }, [activeTab]);

  const addToast = (title, message, type = 'info') => {
    setToasts(prev => [...prev, { id: Date.now(), title, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('intel_')) {
      const field = name.replace('intel_', '');
      setFormData(prev => ({
        ...prev,
        intelligenceSettings: {
          ...prev.intelligenceSettings,
          [field]: checked
        }
      }));
    } else if (name.startsWith('priv_')) {
      const field = name.replace('priv_', '');
      setFormData(prev => ({
        ...prev,
        privacySettings: {
          ...prev.privacySettings,
          [field]: checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData };
      if (typeof payload.targetRoles === 'string') {
        payload.targetRoles = payload.targetRoles.split(',').map(s => s.trim()).filter(Boolean);
      }
      
      const res = await api.patch('/auth/settings', payload);
      // We'd ideally update context here. A page reload works as a simple fallback.
      addToast('Success', 'Settings saved successfully', 'success');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      addToast('Error', err.response?.data?.message || 'Failed to save settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── INSTITUTION CONNECT ──
  const fetchPlacementOfficers = async (instId) => {
    try {
      const { data } = await api.get(`/auth/institutions/${instId}/placement-officers`);
      setInstOfficers(data.data || []);
    } catch (err) {
      addToast('Error', 'Failed to load placement officers', 'error');
    }
  };

  const fetchMentors = async (poId) => {
    try {
      const { data } = await api.get(`/auth/placement-officers/${poId}/mentors`);
      setInstMentors(data.data || []);
    } catch (err) {
      addToast('Error', 'Failed to load mentors', 'error');
    }
  };

  useEffect(() => {
    setInstForm(prev => ({ ...prev, placementOfficerId: '', mentorId: '' }));
    setInstOfficers([]);
    setInstMentors([]);
  }, [instForm.institutionCode]);

  useEffect(() => {
    setInstForm(prev => ({ ...prev, mentorId: '' }));
    setInstMentors([]);
    if (instForm.placementOfficerId) {
      fetchMentors(instForm.placementOfficerId);
    }
  }, [instForm.placementOfficerId]);

  const validateInstitution = async (e) => {
    e.preventDefault();
    if (!instForm.institutionCode) return addToast('Error', 'Please enter an institution code', 'error');
    setLoading(true);
    try {
      const { data } = await api.get(`/auth/institutions/validate?code=${instForm.institutionCode}`);
      if (data.success && data.data) {
        setInstName(data.data.name);
        setInstForm(prev => ({ ...prev, institutionId: data.data._id }));
        await fetchPlacementOfficers(data.data._id);
        addToast('Success', 'Institution verified! Please select your officers below.', 'success');
      }
    } catch (err) {
      addToast('Error', err.response?.data?.message || 'Invalid Institution Code.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectInstitution = async (e) => {
    e.preventDefault();
    if (!instForm.institutionId || !instForm.placementOfficerId || !instForm.mentorId) {
      return addToast('Error', 'Please complete all selections before saving.', 'error');
    }
    setLoading(true);
    try {
      await api.post('/auth/connect-institution', {
        institutionId: instForm.institutionId,
        placementOfficerId: instForm.placementOfficerId,
        mentorId: instForm.mentorId
      });
      addToast('Success', 'Successfully connected to institution!', 'success');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      addToast('Error', err.response?.data?.message || 'Failed to connect institution', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── RESUME ACTIONS ──
  const fetchResumes = async () => {
    setResumeLoading(true);
    try {
      const { data } = await api.get('/resumes');
      setResumes(data.data);
    } catch (err) {
      addToast('Error', 'Failed to fetch resumes', 'error');
    } finally {
      setResumeLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!allowedTypes.includes(file.type)) {
      addToast('Invalid File', 'Please upload a PDF or DOCX file', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast('File too large', 'Maximum size is 5MB', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('name', file.name.split('.')[0]); // default name

    setUploading(true);
    try {
      const response = await fetch('/api/resumes', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        let errData;
        try { errData = await response.json(); } catch(e) {}
        throw new Error(errData?.message || 'Failed to upload resume');
      }

      addToast('Success', 'Resume uploaded successfully', 'success');
      fetchResumes();
    } catch (err) {
      addToast('Upload Failed', err.message || 'Failed to upload resume. AI analysis might be unavailable.', 'error');
    } finally {
      setUploading(false);
      e.target.value = null; // reset input
    }
  };

  const setAsDefault = async (id) => {
    try {
      await api.patch(`/resumes/${id}/default`);
      fetchResumes();
      addToast('Success', 'Default resume updated', 'success');
    } catch (err) {
      addToast('Error', 'Failed to update default resume', 'error');
    }
  };

  const deleteResume = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) return;
    try {
      await api.delete(`/resumes/${id}`);
      fetchResumes();
      addToast('Success', 'Resume deleted', 'success');
    } catch (err) {
      addToast('Error', 'Failed to delete resume', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('WARNING: This will permanently delete your account and all data. Are you absolutely sure?')) return;
    if (!window.confirm('Final Confirmation: Delete JobPulse Account?')) return;
    
    try {
      await api.delete('/auth/me');
      window.location.href = '/';
    } catch (err) {
      addToast('Error', 'Failed to delete account', 'error');
    }
  };

  const tabs = [
    { id: 'profile', label: '👤 Profile' },
    { id: 'resume', label: '📄 Resume Center' },
    { id: 'preferences', label: '🎯 Job Search Preferences' },
    { id: 'institution', label: '🏫 Institution' },
    { id: 'notifications', label: '🔔 Notifications' },
    { id: 'intelligence', label: '🧠 Intelligence' },
    { id: 'privacy', label: '🔒 Data & Privacy' },
  ];

  const inputStyle = { width: '100%', padding: '0.75rem', background: 'var(--color-surface-overlay)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text-primary)' };
  const labelStyle = { display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' };

  return (
    <div className="flex flex-col md:flex-row gap-6 md:gap-8 pt-[80px] pb-12 max-w-[1000px] mx-auto px-4 sm:px-6">
      
      {/* Sidebar Navigation */}
      <div className="w-full md:w-[250px] flex-shrink-0">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '1.5rem' }}>Settings</h1>
        <div className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="whitespace-nowrap flex-shrink-0"
              style={{
                textAlign: 'left',
                padding: '0.75rem 1rem',
                background: activeTab === tab.id ? 'var(--color-surface-raised)' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: activeTab === tab.id ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
                fontWeight: activeTab === tab.id ? 700 : 500,
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '2rem' }}>
        
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Profile</h2>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{user?.name}</div>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{user?.email}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Phone Number</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Location</label>
                <input type="text" name="location" value={formData.location} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email (Read-only)</label>
                <input type="text" value={user?.email} disabled style={{...inputStyle, opacity: 0.5, cursor: 'not-allowed'}} />
              </div>
              <div>
                <label style={labelStyle}>LinkedIn URL</label>
                <input type="text" name="linkedinUrl" value={formData.linkedinUrl} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>GitHub / Portfolio</label>
                <input type="text" name="githubUrl" value={formData.githubUrl} onChange={handleChange} style={inputStyle} />
              </div>
            </div>
            
            <div style={{ marginBottom: '2rem' }}>
              <label style={labelStyle}>Professional Bio</label>
              <textarea name="professionalBio" value={formData.professionalBio} onChange={handleChange} rows={4} style={{...inputStyle, resize: 'vertical'}} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'resume' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Resume Center</h2>
            </div>
            
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
              Upload your resumes to use them with JobPulse Copilot, Career Twin, and JD Matching. PDF or DOCX (Max 5MB).
            </p>

            {/* Drop Zone */}
            <div style={{ 
              border: '2px dashed var(--color-brand-primary)', 
              borderRadius: '12px', 
              padding: '3rem 2rem', 
              textAlign: 'center', 
              background: 'rgba(99, 102, 241, 0.05)',
              marginBottom: '2rem',
              transition: 'var(--transition)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>Drop your resume here</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>or click to browse from your computer</p>
              
              <input type="file" id="resumeUpload" style={{ display: 'none' }} accept=".pdf,.docx,.doc" onChange={handleFileUpload} disabled={uploading} />
              <label htmlFor="resumeUpload" className="btn-primary" style={{ padding: '0.75rem 2rem', fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer', display: 'inline-block', fontSize: '1rem' }}>
                {uploading ? 'Uploading...' : 'Browse Files'}
              </label>
            </div>

            {resumeLoading ? (
              <div style={{ color: 'var(--color-text-muted)' }}>Loading resumes...</div>
            ) : resumes.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--color-surface-overlay)', border: '1px dashed var(--color-border)', borderRadius: '12px' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📄</div>
                <h3 style={{ marginBottom: '0.5rem' }}>No resumes uploaded</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Upload your first resume to power up Career Intelligence.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {resumes.map(res => (
                  <div key={res._id} className={`flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-4 bg-[var(--color-surface-overlay)] rounded-xl border ${res.isDefault ? 'border-[var(--color-brand-primary)]' : 'border-[var(--color-border)]'}`}>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-bold text-[1.05rem] text-[var(--color-text-primary)]">{res.name}</span>
                        {res.isDefault && <span className="bg-[var(--color-brand-primary)] text-white text-[0.65rem] px-2 py-0.5 rounded font-bold">DEFAULT</span>}
                      </div>
                      <div className="text-[0.85rem] text-[var(--color-text-secondary)]">
                        {res.version} • {(res.fileSize / 1024).toFixed(1)} KB • Uploaded {new Date(res.createdAt).toLocaleDateString()}
                      </div>
                      {res.skills && res.skills.length > 0 && (
                        <div className="text-[0.8rem] text-[var(--color-text-muted)] mt-2">
                          Skills: {res.skills.slice(0, 5).join(', ')}{res.skills.length > 5 ? '...' : ''}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      {!res.isDefault && (
                        <button onClick={() => setAsDefault(res._id)} className="flex-1 sm:flex-none px-3 py-2 bg-transparent border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg text-[0.85rem] font-medium cursor-pointer transition-colors hover:bg-[var(--color-surface-raised)]">
                          Set Default
                        </button>
                      )}
                      <button onClick={() => deleteResume(res._id)} className="flex-1 sm:flex-none px-3 py-2 bg-transparent border border-[#ef4444] text-[#ef4444] rounded-lg text-[0.85rem] font-medium cursor-pointer transition-colors hover:bg-[rgba(239,68,68,0.1)]">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'preferences' && (
          <form onSubmit={handleSaveProfile}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Job Search Preferences</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
              These explicit preferences will guide the Career Twin and Copilot.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <label style={labelStyle}>Target Roles (comma separated)</label>
                <input type="text" name="targetRoles" value={formData.targetRoles} onChange={handleChange} placeholder="e.g. Backend Developer, Full Stack Engineer" style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label style={labelStyle}>Target Salary</label>
                  <input type="text" name="targetSalary" value={formData.targetSalary} onChange={handleChange} placeholder="e.g. ₹8-12 LPA or $100k-$120k" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Work Preference</label>
                  <select name="workPreference" value={formData.workPreference} onChange={handleChange} style={inputStyle}>
                    <option value="Any">Any</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>
                {loading ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'institution' && (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Institution Connection</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
              Link your account to your university or bootcamp to get guidance from your placement officers and mentors.
            </p>

            {user?.institutionId ? (
              <div style={{ padding: '2rem', background: 'var(--color-surface-overlay)', border: '1px solid var(--color-border)', borderRadius: '12px', textAlign: 'center' }}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }}>🏫</span>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>You are connected!</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                  Your account is managed by your institution's Placement team.
                </p>
              </div>
            ) : (
              <div style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.5rem' }}>
                {!instForm.institutionId ? (
                  <form onSubmit={validateInstitution} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={labelStyle}>Institution Code</label>
                      <input type="text" name="institutionCode" value={instForm.institutionCode} onChange={(e) => setInstForm(prev => ({...prev, institutionCode: e.target.value}))} placeholder="e.g. JP-ABC-2026" style={inputStyle} required />
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '0.75rem', fontWeight: 600 }}>
                      {loading ? 'Validating...' : 'Verify Code'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleConnectInstitution} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', color: '#10b981', marginBottom: '1rem', fontWeight: 600 }}>
                      ✓ Verified: {instName}
                    </div>
                    
                    <div>
                      <label style={labelStyle}>Select Placement Officer</label>
                      <select name="placementOfficerId" value={instForm.placementOfficerId} onChange={(e) => setInstForm(prev => ({...prev, placementOfficerId: e.target.value}))} style={inputStyle} required>
                        <option value="" disabled>Select Officer...</option>
                        {instOfficers.map(off => (
                          <option key={off._id} value={off._id}>{off.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>Select Mentor</label>
                      <select name="mentorId" value={instForm.mentorId} onChange={(e) => setInstForm(prev => ({...prev, mentorId: e.target.value}))} style={inputStyle} required>
                        <option value="" disabled>Select Mentor...</option>
                        {instMentors.map(men => (
                          <option key={men._id} value={men._id}>{men.name}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                      <button type="button" onClick={() => setInstForm({ institutionCode: '', placementOfficerId: '', mentorId: '', institutionId: '' })} style={{ width: '30%', padding: '0.75rem', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', borderRadius: '8px', cursor: 'pointer' }}>
                        Cancel
                      </button>
                      <button type="submit" disabled={loading || !instForm.mentorId} className="btn-primary" style={{ flex: 1, padding: '0.75rem', fontWeight: 600 }}>
                        {loading ? 'Connecting...' : 'Connect to Institution'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <form onSubmit={handleSaveProfile}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Notifications</h2>
            
            <div style={{ marginBottom: '2rem' }}>
              <label style={labelStyle}>Follow-Up Window (Days)</label>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>Flag applications in "Applied" status after this many days with no activity.</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <input type="range" name="followUpWindowDays" min="1" max="30" value={formData.followUpWindowDays} onChange={handleChange} style={{ flex: 1 }} />
                <span style={{ fontWeight: 700 }}>{formData.followUpWindowDays} Days</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input type="checkbox" name="emailNotifications" checked={formData.emailNotifications} onChange={handleChange} />
                <span>Email Reminders (stale applications)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input type="checkbox" name="deadlineReminders" checked={formData.deadlineReminders} onChange={handleChange} />
                <span>Deadline Alerts</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input type="checkbox" name="interviewReminders" checked={formData.interviewReminders} onChange={handleChange} />
                <span>Interview Reminders</span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>
                {loading ? 'Saving...' : 'Save Notifications'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'intelligence' && (
          <form onSubmit={handleSaveProfile}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Intelligence Settings</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                <input type="checkbox" name="intel_careerIntelligence" checked={formData.intelligenceSettings?.careerIntelligence} onChange={handleChange} style={{ marginTop: '0.25rem' }} />
                <div>
                  <div style={{ fontWeight: 600 }}>Career Intelligence Core</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Enable Job Search DNA, Opportunity Radar, and Funnel Diagnosis.</div>
                </div>
              </label>
              
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                <input type="checkbox" name="intel_copilot" checked={formData.intelligenceSettings?.copilot} onChange={handleChange} style={{ marginTop: '0.25rem' }} />
                <div>
                  <div style={{ fontWeight: 600 }}>JobPulse Copilot</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Allow the conversational AI to analyze your pipeline context.</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                <input type="checkbox" name="intel_strategyRecommendations" checked={formData.intelligenceSettings?.strategyRecommendations} onChange={handleChange} style={{ marginTop: '0.25rem' }} />
                <div>
                  <div style={{ fontWeight: 600 }}>Strategy Autopilot</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Receive actionable recommendations in the Action Center.</div>
                </div>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'privacy' && (
          <div>
            <form onSubmit={handleSaveProfile}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Data & Privacy</h2>
            
            <div style={{ padding: '1.5rem', background: 'var(--color-surface-overlay)', border: '1px solid var(--color-border)', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Placement Sharing</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Your placement department can only access information you choose to share, subject to institutional policy.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { field: 'applicationProgress', label: 'Application Progress' },
                  { field: 'interviewProgress', label: 'Interview Progress' },
                  { field: 'skills', label: 'Skills' },
                  { field: 'resume', label: 'Resume' },
                  { field: 'salary', label: 'Salary' },
                  { field: 'careerPreferences', label: 'Career Preferences' },
                ].map(({ field, label }) => (
                  <label key={field} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                    <span style={{ fontWeight: 600 }}>{label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: formData.privacySettings?.[field] ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                        {formData.privacySettings?.[field] ? 'ON' : 'OFF'}
                      </span>
                      <input 
                        type="checkbox" 
                        name={`priv_${field}`} 
                        checked={formData.privacySettings?.[field] || false} 
                        onChange={handleChange} 
                        style={{ width: '18px', height: '18px' }} 
                      />
                    </div>
                  </label>
                ))}
                <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '0.6rem 1.25rem', fontWeight: 600 }}>
                  {loading ? 'Saving...' : 'Save Privacy Settings'}
                </button>
              </div>
            </div>
          </form>

          <div style={{ padding: '1.5rem', background: 'var(--color-surface-overlay)', border: '1px solid var(--color-border)', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Export Data</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>Download a copy of your application tracking history as JSON.</p>
              <button type="button" onClick={() => window.open(`${api.defaults.baseURL}/applications/export/json`, '_blank')} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                Download JSON
              </button>
            </div>

            <div style={{ padding: '1.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#ef4444' }}>Danger Zone</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>Permanently delete your account and all associated data. This action cannot be undone.</p>
              <button onClick={handleDeleteAccount} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                Delete Account
              </button>
            </div>
          </div>
        )}
      </div>

      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};

export default Settings;
