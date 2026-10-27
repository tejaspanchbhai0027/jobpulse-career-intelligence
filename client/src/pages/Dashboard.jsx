import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useApplications from '../hooks/useApplications';
import { useAllInterviews } from '../hooks/useInterviews';
import useTasks from '../hooks/useTasks';
import useReadiness from '../hooks/useReadiness';
import useOpportunities from '../hooks/useOpportunities';
import usePlacementDrives from '../hooks/usePlacementDrives';
import api from '../api/axios';

const StatCard = ({ label, value, color, icon }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', gap: '1rem',
    padding: '24px',
    background: 'linear-gradient(145deg, var(--color-surface) 0%, rgba(255,255,255,0.01) 100%)',
    border: `1px solid var(--color-border)`,
    borderTop: `3px solid ${color}`,
    borderRadius: '16px',
    flex: 1,
    minWidth: '200px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
    position: 'relative',
    overflow: 'hidden'
  }}>
    <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '80px', height: '80px', background: `${color}10`, borderRadius: '50%', filter: 'blur(20px)' }}></div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${color}15`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
    </div>
    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--color-text-primary)', lineHeight: 1, letterSpacing: '-0.02em', position: 'relative', zIndex: 1 }}>
      {value}
    </div>
  </div>
);

const SkeletonLoader = () => (
  <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
    <div style={{ height: '40px', width: '300px', background: 'var(--color-surface-overlay)', borderRadius: '8px', marginBottom: '8px', animation: 'pulse 1.5s infinite' }}></div>
    <div style={{ height: '20px', width: '200px', background: 'var(--color-surface-overlay)', borderRadius: '8px', marginBottom: '32px', animation: 'pulse 1.5s infinite' }}></div>
    <div style={{ height: '200px', width: '100%', background: 'var(--color-surface)', borderRadius: '18px', marginBottom: '32px', animation: 'pulse 1.5s infinite' }}></div>
    <div style={{ display: 'flex', gap: '24px' }}>
      {[1, 2, 3, 4].map(i => <div key={i} style={{ flex: 1, height: '120px', background: 'var(--color-surface)', borderRadius: '18px', animation: 'pulse 1.5s infinite' }}></div>)}
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { applications, loading: appsLoading } = useApplications();
  const { interviews: allInterviews } = useAllInterviews();
  const { tasks, loading: tasksLoading } = useTasks();
  const { data: readinessData, loading: readinessLoading } = useReadiness();
  const { opportunities } = useOpportunities({ recommended: true });
  const { drives } = usePlacementDrives();
  const activeDrives = useMemo(() => drives?.filter(d => d.status === 'PUBLISHED' || d.status === 'REGISTRATION_OPEN') || [], [drives]);

  const [connectionReq, setConnectionReq] = React.useState(null);

  React.useEffect(() => {
    if (user?.connectionStatus === 'PENDING' || user?.connectionStatus === 'REJECTED') {
      api.get('/auth/connection-status').then(({ data }) => {
        if (data.success && data.data) {
          setConnectionReq(data.data);
        }
      }).catch(err => console.error('Failed to load connection status:', err));
    }
  }, [user]);

  // ── Metrics Calculation ──
  const stats = useMemo(() => {
    const total = applications.length;
    // In progress: Active stages excluding Wishlist, Offer, Rejected
    const inProgress = applications.filter(a => ['Applied', 'Assessment', 'Interview'].includes(a.status)).length;
    const offers = applications.filter(a => a.status === 'Offer').length;
    const followUp = applications.filter(a => a.needsFollowUp).length;
    return { total, inProgress, offers, followUp };
  }, [applications]);

  const upcomingInterviews = useMemo(() => {
    const now = new Date();
    return allInterviews
      .filter(iv => new Date(iv.scheduledAt) >= now && (iv.result === 'Scheduled' || iv.result === 'Rescheduled'))
      .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  }, [allInterviews]);
  
  const nextInterview = upcomingInterviews[0];

  // ── Next Actions & Overdue Tasks Calculation ──
  const { nextActions, overdueItems } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Get incomplete tasks
    const pendingTasks = tasks.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled');
    
    // Get apps with next actions
    const followUpApps = applications.filter(a => a.followUpDate && a.followUpStatus !== 'Completed' && a.followUpStatus !== 'Not Required');

    let allItems = [
      ...pendingTasks.map(t => ({ id: t._id, type: 'Task', title: t.title, date: t.dueDate, priority: t.priority, ref: t, link: '/tasks' })),
      ...followUpApps.map(a => ({ id: a._id, type: 'FollowUp', title: a.nextAction || 'Follow up with recruiter', date: a.followUpDate, priority: a.isPriority ? 'High' : 'Medium', ref: a, link: '/applications' }))
    ];

    const nextActions = [];
    const overdueItems = [];

    allItems.forEach(item => {
      if (!item.date) {
        nextActions.push(item); // No date, just pending
      } else {
        const itemDateStr = new Date(item.date).toISOString().split('T')[0];
        if (itemDateStr < todayStr) {
          overdueItems.push(item);
        } else {
          nextActions.push(item);
        }
      }
    });

    nextActions.sort((a, b) => (!a.date ? 1 : !b.date ? -1 : new Date(a.date) - new Date(b.date)));
    overdueItems.sort((a, b) => new Date(a.date) - new Date(b.date));

    return { nextActions: nextActions.slice(0, 5), overdueItems: overdueItems.slice(0, 5) };
  }, [tasks, applications]);

  // ── Next Best Action Logic ──
  const action = useMemo(() => {
    if (!readinessData?.recommendedAction) {
      return { label: 'Getting Started', title: 'Loading Next Steps...', desc: 'Please wait...', link: '/dashboard', cta: '...' };
    }
    const rec = readinessData.recommendedAction;
    return {
      label: 'Recommended Action',
      title: rec.text.split('.')[0] || 'Next Step',
      desc: rec.text,
      link: rec.link,
      cta: rec.buttonText
    };
  }, [readinessData]);

  // ── Recent Applications Sort ──
  const recentApplications = useMemo(() => {
    return [...applications]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 4);
  }, [applications]);

  // Display Skeleton if initial fetch is incomplete
  if (appsLoading && applications.length === 0) {
    return (
      <div className="page-container" style={{ minHeight: '100vh', background: 'var(--color-bg)', padding: '32px', paddingTop: 'max(96px, env(safe-area-inset-top, 0px))' }}>
        <SkeletonLoader />
      </div>
    );
  }

  return (
    <div className="page-container" style={{ minHeight: '100vh', background: 'var(--color-bg)', padding: '36px' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {connectionReq && connectionReq.status === 'PENDING' && (
          <div style={{ padding: '16px 24px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', color: '#b45309', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.25rem' }}>⏳</span>
            <div>
              <div style={{ fontWeight: 600 }}>Connection Request Pending</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Your request to join {connectionReq.institutionId?.name || 'Institution'} is pending approval from {connectionReq.mentorId?.name || 'Mentor'}.</div>
            </div>
          </div>
        )}

        {/* HEADER */}
        <div style={{ marginBottom: '8px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-brand-primary)] to-[#20b2aa]">{user?.name?.split(' ')[0] || 'Student'}</span> 👋
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', marginTop: '0.5rem', fontWeight: 500 }}>
            Here's your career overview.
          </p>
        </div>

        {/* KPI CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
          <StatCard label="Career Readiness" value={`${readinessData?.profile?.percentage || 0}%`} color="var(--color-brand-primary)" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>} />
          <StatCard label="Total Applications" value={stats.total} color="var(--color-text-primary)" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>} />
          <StatCard label="Upcoming Interviews" value={upcomingInterviews.length} color="#10b981" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>} />
          <StatCard label="Offers" value={stats.offers} color="#f59e0b" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>} />
        </div>

        {/* TWO COLUMN LAYOUT FOR MAIN CONTENT */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
          
          {/* RECOMMENDED ACTION */}
          <div style={{ 
            background: 'linear-gradient(135deg, var(--color-surface) 0%, rgba(32, 178, 170, 0.05) 100%)', 
            padding: '24px', 
            borderRadius: '16px', 
            border: '1px solid var(--color-border)',
            borderLeft: '4px solid var(--color-brand-primary)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '24px',
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: '1 1 min-content' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🎯</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-brand-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recommended Next Action</span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '4px' }}>{action.title}</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>{action.desc}</p>
            </div>
            <button onClick={() => navigate(action.link)} className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', fontSize: '0.95rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
              {action.cta}
            </button>
          </div>

          {/* TASKS (TODAY'S CAREER FOCUS) */}
          <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>⚡</span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Today's Career Focus</h3>
              </div>
              <button onClick={() => navigate('/tasks')} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                View Tasks <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[...overdueItems, ...nextActions].slice(0, 4).map((item, index) => {
                const isOverdue = overdueItems.some(o => o.id === item.id);
                const color = isOverdue ? '#ef4444' : (item.date ? '#f59e0b' : '#10b981');
                
                return (
                  <div key={`${item.id}-${index}`} onClick={() => navigate(item.link)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--color-surface-overlay)', borderRadius: '12px', cursor: 'pointer', border: '1px solid var(--color-border)', transition: 'border-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor='var(--color-brand-primary)'} onMouseLeave={e => e.currentTarget.style.borderColor='var(--color-border)'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: color, border: `3px solid ${color}33` }} />
                      <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{item.title}</span>
                    </div>
                    <span style={{ fontSize: '0.85rem', color: isOverdue ? '#ef4444' : 'var(--color-text-muted)', fontWeight: 600 }}>
                      {isOverdue ? 'Overdue' : (item.date ? `Due ${new Date(item.date).toLocaleDateString()}` : 'No deadline')}
                    </span>
                  </div>
                );
              })}
              {[...overdueItems, ...nextActions].length === 0 && (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                  No immediate tasks. You're all caught up!
                </div>
              )}
            </div>
          </div>

          {/* GRID ROW: OPPORTUNITIES & INTERVIEWS/COPILOT */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
            
            {/* RECOMMENDED OPPORTUNITIES */}
            <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>🎯</span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Recommended Opportunities</h3>
                </div>
                <button onClick={() => navigate('/opportunities')} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  View All <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </button>
              </div>

              {opportunities && opportunities.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {opportunities.slice(0, 3).map(opp => (
                    <div key={opp._id} onClick={() => navigate('/opportunities')} style={{ padding: '16px', background: 'var(--color-surface-overlay)', borderRadius: '12px', cursor: 'pointer', border: '1px solid var(--color-border)', transition: 'border-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor='var(--color-brand-primary)'} onMouseLeave={e => e.currentTarget.style.borderColor='var(--color-border)'}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text-primary)' }}>{opp.title}</div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{opp.company}</div>
                        </div>
                        {opp.match && opp.match.score > 0 && (
                          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-success)', background: 'var(--color-success)15', padding: '4px 8px', borderRadius: '6px' }}>
                            {opp.match.score}% Match
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {opp.skills && opp.skills.slice(0, 3).map((skill, i) => (
                          <span key={i} style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '4px', color: 'var(--color-text-secondary)' }}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                  No new recommendations right now.
                </div>
              )}
            </div>

            {/* INTERVIEWS & DRIVES STACK */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* UPCOMING INTERVIEW */}
              <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🎤</span>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Upcoming Interview</h3>
                  </div>
                </div>
                
                {nextInterview ? (
                  <div>
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                      <div style={{ background: 'var(--color-surface-overlay)', borderRadius: '12px', padding: '12px', textAlign: 'center', minWidth: '70px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-brand-primary)', fontWeight: 800, textTransform: 'uppercase' }}>{new Date(nextInterview.scheduledAt).toLocaleString('default', { month: 'short' })}</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1, margin: '4px 0' }}>{new Date(nextInterview.scheduledAt).getDate()}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{nextInterview.application?.role || nextInterview.type || 'Interview'}</h4>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', fontWeight: 500 }}>{nextInterview.application?.company || 'Unknown Company'}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                          {new Date(nextInterview.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    <div style={{ padding: '12px 0' }}>No upcoming interviews</div>
                  </div>
                )}
              </div>

              {/* AVAILABLE PLACEMENT DRIVES */}
              <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--color-border)', borderTop: '4px solid #10b981', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '200px', height: '200px', background: '#10b981', opacity: 0.05, borderRadius: '50%', filter: 'blur(30px)', pointerEvents: 'none' }}></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
                  <span style={{ fontSize: '1.2rem' }}>🏢</span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>Active Placement Drives</h3>
                </div>
                {activeDrives.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', zIndex: 1 }}>
                    {activeDrives.slice(0, 2).map(drive => (
                      <div key={drive._id} onClick={() => navigate('/placement-updates')} style={{ padding: '12px 16px', background: 'var(--color-surface-overlay)', borderRadius: '12px', cursor: 'pointer', border: '1px solid var(--color-border)' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>{drive.company}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{drive.title}</div>
                      </div>
                    ))}
                    {activeDrives.length > 2 && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '4px' }}>
                        +{activeDrives.length - 2} more drives
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', fontStyle: 'italic', lineHeight: 1.6, marginBottom: '16px', position: 'relative', zIndex: 1 }}>
                    There are no active placement drives right now. Check back later!
                  </p>
                )}
                <button onClick={() => navigate('/placement-updates')} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'none', padding: '0.6rem 1rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px', position: 'relative', zIndex: 1, marginTop: '16px' }}>
                  View Placement Drives <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;