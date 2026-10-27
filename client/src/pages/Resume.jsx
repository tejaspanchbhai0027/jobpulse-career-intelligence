import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Toast from '../components/ui/Toast';

const Resume = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzingMap, setAnalyzingMap] = useState({});
  const [toasts, setToasts] = useState([]);
  
  const [uploadForm, setUploadForm] = useState({ name: '', targetRole: '', file: null });
  
  // JD Match State
  const [jdMatchResumeId, setJdMatchResumeId] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jdMatchResult, setJdMatchResult] = useState(null);
  const [jdMatching, setJdMatching] = useState(false);

  // Analysis Modal State
  const [viewAnalysisModal, setViewAnalysisModal] = useState(null);

  useEffect(() => {
    fetchResumes();
  }, []);

  const addToast = (title, message, type = 'info') => {
    setToasts(prev => [...prev, { id: Date.now(), title, message, type }]);
  };

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const fetchResumes = async () => {
    setResumeLoading(true);
    try {
      const { data } = await api.get('/resumes');
      setResumes(data.data);
      if (data.data.length > 0 && !jdMatchResumeId) {
        const primary = data.data.find(r => r.isDefault);
        setJdMatchResumeId(primary ? primary._id : data.data[0]._id);
      }
    } catch (err) {
      addToast('Error', 'Failed to fetch resumes', 'error');
    } finally {
      setResumeLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadForm(prev => ({ 
        ...prev, 
        file, 
        name: prev.name || file.name.split('.').slice(0, -1).join('.')
      }));
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    const { file, name, targetRole } = uploadForm;
    if (!file || !name) return addToast('Error', 'File and Name are required', 'error');

    const allowedTypes = ['application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return addToast('Invalid File', 'Only PDF documents are allowed', 'error');
    }
    if (file.size > 5 * 1024 * 1024) {
      return addToast('File Too Large', 'Maximum file size is 5MB', 'error');
    }

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('name', name);
    formData.append('targetRole', targetRole);

    setUploading(true);
    try {
      await api.post('/resumes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      addToast('Success', 'Resume uploaded and analyzed successfully!', 'success');
      setUploadForm({ name: '', targetRole: '', file: null });
      fetchResumes();
    } catch (err) {
      addToast('Upload Failed', err.response?.data?.message || 'Failed to upload resume', 'error');
    } finally {
      setUploading(false);
    }
  };

  const setAsPrimary = async (id) => {
    try {
      await api.patch(`/resumes/${id}/default`);
      addToast('Success', 'Primary resume updated', 'success');
      fetchResumes();
    } catch (err) {
      addToast('Error', 'Failed to set primary', 'error');
    }
  };

  const deleteResume = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resume? Note: if this resume is attached to historical applications, those applications will still keep a reference but the file will be removed.')) return;
    try {
      await api.delete(`/resumes/${id}`);
      addToast('Success', 'Resume deleted', 'success');
      fetchResumes();
    } catch (err) {
      addToast('Error', 'Failed to delete resume', 'error');
    }
  };

  const analyzeATS = async (id) => {
    setAnalyzingMap(prev => ({ ...prev, [id]: true }));
    try {
      await api.post(`/resumes/${id}/analyze`);
      addToast('Success', 'Resume ATS Analysis updated', 'success');
      fetchResumes();
    } catch (err) {
      addToast('Error', err.response?.data?.message || 'Failed to analyze resume', 'error');
    } finally {
      setAnalyzingMap(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleJDMatch = async () => {
    if (!jdMatchResumeId || !jobDescription.trim()) {
      return addToast('Error', 'Please select a resume and paste a job description', 'error');
    }
    setJdMatching(true);
    try {
      const { data } = await api.post(`/resumes/${jdMatchResumeId}/jd-match`, { jobDescription });
      setJdMatchResult(data.data);
      addToast('Success', 'JD Match Analysis complete', 'success');
    } catch (err) {
      addToast('Error', err.response?.data?.message || 'Failed to match JD', 'error');
    } finally {
      setJdMatching(false);
    }
  };

  const downloadResume = async (id, name) => {
    try {
      const response = await api.get(`/resumes/${id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${name}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      addToast('Error', 'Failed to download resume', 'error');
    }
  };

  const { totalResumes, highestAts, avgAts, primaryResume } = useMemo(() => {
    if (resumes.length === 0) return { totalResumes: 0, highestAts: 0, avgAts: 0, primaryResume: null };
    const atsScores = resumes.map(r => r.atsScore || 0);
    return {
      totalResumes: resumes.length,
      highestAts: Math.max(...atsScores),
      avgAts: Math.round(atsScores.reduce((a, b) => a + b, 0) / resumes.length),
      primaryResume: resumes.find(r => r.isDefault) || resumes[0]
    };
  }, [resumes]);

  return (
    <div className="page-container" style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', padding: '36px' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div style={{
        marginBottom: '24px',
        flexShrink: 0,
      }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1.1, margin: 0, letterSpacing: '-0.03em' }}>
          Resume Center
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', marginTop: '0.5rem', fontWeight: 500 }}>
          Manage your resumes and analyze ATS compatibility.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Dashboard Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
            <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Total Resumes</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px' }}>{totalResumes}</div>
            </div>
            <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Highest ATS Score</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: highestAts >= 80 ? 'var(--color-success)' : highestAts >= 60 ? 'var(--color-warning)' : 'var(--color-danger)', marginTop: '8px' }}>
                {highestAts}<span style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>/100</span>
              </div>
            </div>
            <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Average ATS Score</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px' }}>
                {avgAts}<span style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>/100</span>
              </div>
            </div>
            <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Primary Resume</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '8px', color: 'var(--color-brand-primary)' }}>
                {primaryResume ? primaryResume.name : 'None Set'}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
            
            {/* Upload Area */}
            <div style={{ background: 'var(--color-surface)', padding: '32px', borderRadius: '18px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '24px' }}>Upload New Resume</h2>
              <form onSubmit={handleUploadSubmit} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Resume Name *</label>
                  <input type="text" value={uploadForm.name} onChange={e => setUploadForm({...uploadForm, name: e.target.value})} placeholder="e.g. Data Analyst Resume" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }} required />
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Target Role</label>
                  <input type="text" value={uploadForm.targetRole} onChange={e => setUploadForm({...uploadForm, targetRole: e.target.value})} placeholder="e.g. Data Analyst" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }} />
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>File (PDF only) *</label>
                  <input type="file" accept=".pdf" onChange={handleFileChange} style={{ width: '100%', padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }} required />
                </div>
                <button type="submit" disabled={uploading} className="btn-primary" style={{ padding: '10px 24px', borderRadius: '8px', fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer' }}>
                  {uploading ? 'Uploading & Analyzing...' : 'Upload & Analyze'}
                </button>
              </form>
            </div>

            {/* My Resumes List */}
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '16px' }}>My Resumes</h2>
              {resumeLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading resumes...</div>
              ) : resumes.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--color-surface)', borderRadius: '16px', border: '1px dashed var(--color-border)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📄</div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>No resumes uploaded yet</h3>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>Upload your first resume to start managing versions and analyzing ATS compatibility.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {resumes.map(res => (
                    <div key={res._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', background: 'var(--color-surface)', borderRadius: '16px', border: res.isDefault ? '2px solid var(--color-brand-primary)' : '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)', flexWrap: 'wrap', gap: '24px' }}>
                      <div style={{ flex: '1 1 300px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{res.name}</h3>
                          {res.isDefault && <span style={{ background: 'var(--color-brand-primary)', color: '#fff', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>PRIMARY</span>}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Target Role: {res.targetRole || 'General'}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Uploaded: {new Date(res.createdAt).toLocaleDateString()} • {(res.fileSize / 1024).toFixed(1)} KB</div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        {res.analysis && res.analysis.status === 'analyzed' ? (
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: (res.atsScore || 0) >= 80 ? 'var(--color-success)' : (res.atsScore || 0) >= 60 ? 'var(--color-warning)' : 'var(--color-danger)' }}>{res.atsScore || 0}</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>ATS Score</div>
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No Analysis</div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {res.analysis && res.analysis.status === 'analyzed' && (
                              <button onClick={() => setViewAnalysisModal(res)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>View Analysis</button>
                            )}
                            <button onClick={() => downloadResume(res._id, res.name)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Download</button>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => analyzeATS(res._id)} disabled={analyzingMap[res._id]} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-brand-primary)', fontSize: '0.8rem', fontWeight: 600, cursor: analyzingMap[res._id] ? 'not-allowed' : 'pointer' }}>
                              {analyzingMap[res._id] ? 'Analyzing...' : 'Re-Analyze'}
                            </button>
                            {!res.isDefault && (
                              <button onClick={() => setAsPrimary(res._id)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Set Primary</button>
                            )}
                            <button onClick={() => deleteResume(res._id)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--color-danger)', background: 'var(--color-bg)', color: 'var(--color-danger)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Delete</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Resume vs JD Match */}
            <div style={{ background: 'var(--color-surface)', padding: '32px', borderRadius: '18px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '24px' }}>Resume vs Job Description Match</h2>
              
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 300px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Select Resume</label>
                  <select value={jdMatchResumeId} onChange={e => setJdMatchResumeId(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)', marginBottom: '16px' }}>
                    <option value="">-- Select a Resume --</option>
                    {resumes.map(r => <option key={r._id} value={r._id}>{r.name} {r.isDefault ? '(Primary)' : ''}</option>)}
                  </select>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Paste Job Description</label>
                  <textarea value={jobDescription} onChange={e => setJobDescription(e.target.value)} rows="8" placeholder="Paste the job description here..." style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)', resize: 'vertical' }}></textarea>
                  <button onClick={handleJDMatch} disabled={jdMatching} className="btn-primary" style={{ width: '100%', padding: '12px', borderRadius: '8px', fontWeight: 700, marginTop: '16px', cursor: jdMatching ? 'not-allowed' : 'pointer' }}>
                    {jdMatching ? 'Analyzing Match...' : 'Analyze Match'}
                  </button>
                </div>

                <div style={{ flex: '1 1 400px', background: 'var(--color-bg)', borderRadius: '12px', border: '1px solid var(--color-border)', padding: '24px', display: 'flex', flexDirection: 'column' }}>
                  {!jdMatchResult ? (
                    <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                      Select a resume and provide a job description to see the match analysis.
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>JD Match Score</h3>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: jdMatchResult.matchScore >= 80 ? 'var(--color-success)' : jdMatchResult.matchScore >= 60 ? 'var(--color-warning)' : 'var(--color-danger)' }}>
                          {jdMatchResult.matchScore}/100
                        </div>
                      </div>

                      <div style={{ marginBottom: '24px' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px', color: 'var(--color-brand-primary)' }}>Matching Skills / Qualifications</h4>
                        {jdMatchResult.strong && jdMatchResult.strong.length > 0 ? (
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {jdMatchResult.strong.map((s, i) => <span key={i} style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--color-brand-primary)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>{s}</span>)}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>No strong matches found.</div>
                        )}
                      </div>

                      <div style={{ marginBottom: '24px' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px', color: 'var(--color-danger)' }}>Missing Keywords / Skills</h4>
                        {jdMatchResult.missing && jdMatchResult.missing.length > 0 ? (
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {jdMatchResult.missing.map((m, i) => <span key={i} style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>{m}</span>)}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>No critical missing skills found.</div>
                        )}
                      </div>

                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px', color: 'var(--color-success)' }}>Suggested Keywords to Add</h4>
                        {jdMatchResult.suggestedKeywords && jdMatchResult.suggestedKeywords.length > 0 ? (
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {jdMatchResult.suggestedKeywords.map((s, i) => <span key={i} style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--color-success)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>{s}</span>)}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Resume is well optimized for keywords.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <Toast toasts={toasts} onDismiss={removeToast} />

      {/* ATS Analysis Modal */}
      {viewAnalysisModal && viewAnalysisModal.analysis && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'var(--color-surface)', width: '100%', maxWidth: '700px', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh', border: '1px solid var(--color-border)', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>ATS Analysis: {viewAnalysisModal.name}</h2>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Estimated ATS Score</div>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: (viewAnalysisModal.atsScore || 0) >= 80 ? 'var(--color-success)' : (viewAnalysisModal.atsScore || 0) >= 60 ? 'var(--color-warning)' : 'var(--color-danger)' }}>
                {viewAnalysisModal.atsScore || 0}/100
              </div>
            </div>
            
            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px' }}>
                <div style={{ padding: '16px', background: 'var(--color-bg)', borderRadius: '12px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Keyword Match</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{viewAnalysisModal.analysis.keywordMatch || 0}%</div>
                </div>
                <div style={{ padding: '16px', background: 'var(--color-bg)', borderRadius: '12px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Skills Match</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{viewAnalysisModal.analysis.skillsMatch || 0}%</div>
                </div>
                <div style={{ padding: '16px', background: 'var(--color-bg)', borderRadius: '12px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Structure</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{viewAnalysisModal.analysis.structureScore || 0}%</div>
                </div>
                <div style={{ padding: '16px', background: 'var(--color-bg)', borderRadius: '12px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Relevance</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{viewAnalysisModal.analysis.relevanceScore || 0}%</div>
                </div>
                <div style={{ padding: '16px', background: 'var(--color-bg)', borderRadius: '12px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Completeness</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{viewAnalysisModal.analysis.completenessScore || 0}%</div>
                </div>
              </div>

              {viewAnalysisModal.analysis.strengths && viewAnalysisModal.analysis.strengths.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-success)', marginBottom: '12px' }}>✓ Strengths</h3>
                  <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                    {viewAnalysisModal.analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}

              {viewAnalysisModal.analysis.missingKeywords && viewAnalysisModal.analysis.missingKeywords.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-danger)', marginBottom: '12px' }}>⚠ Missing Keywords for Target Role</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {viewAnalysisModal.analysis.missingKeywords.map((m, i) => <span key={i} style={{ padding: '4px 10px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.85rem' }}>{m}</span>)}
                  </div>
                </div>
              )}

              {viewAnalysisModal.analysis.suggestions && viewAnalysisModal.analysis.suggestions.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-warning)', marginBottom: '12px' }}>💡 Resume Improvement Suggestions</h3>
                  <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                    {viewAnalysisModal.analysis.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'var(--color-bg)' }}>
              <button 
                onClick={() => {
                  const message = `I'm looking at the ATS analysis for my resume "${viewAnalysisModal.name}". My score is ${viewAnalysisModal.atsScore || 0}/100. The suggestions are: ${viewAnalysisModal.analysis.suggestions.join(', ')}. How can I effectively make these changes?`;
                  navigate('/copilot', { state: { message, specificContext: { resumeAnalysis: viewAnalysisModal.analysis } } });
                }} 
                style={{ padding: '10px 24px', borderRadius: '8px', fontWeight: 700, background: 'var(--gradient-brand)', color: '#000', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                🤖 Ask Copilot
              </button>
              <button onClick={() => setViewAnalysisModal(null)} className="btn-primary" style={{ padding: '10px 24px', borderRadius: '8px', fontWeight: 700 }}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Resume;
