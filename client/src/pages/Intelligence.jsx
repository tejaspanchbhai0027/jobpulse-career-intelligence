import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import JDMatchWidget from '../components/intelligence/JDMatchWidget';
import LogInterviewModal from '../components/modals/LogInterviewModal';
import { ReactFlow, Controls, Background } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const Intelligence = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data States
  const [dna, setDna] = useState(null);
  const [diagnosis, setDiagnosis] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [resumePerf, setResumePerf] = useState(null);
  const [market, setMarket] = useState(null);
  const [twin, setTwin] = useState(null);
  const [autopilot, setAutopilot] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  
  const [loading, setLoading] = useState(true);
  const [isLogQuestionModalOpen, setIsLogQuestionModalOpen] = useState(false);

  const fetchQuestionsOnly = async () => {
    try {
      const qRes = await axios.get('/api/interviews/questions/bank', { withCredentials: true });
      if (qRes.data.success) setQuestions(qRes.data.data);
    } catch (err) {
      console.error('Error fetching questions:', err);
    }
  };

  useEffect(() => {
    const fetchIntelligenceData = async () => {
      setLoading(true);
      try {
        const [dnaRes, diagRes, oppRes, resPerfRes, marketRes, twinRes, autoRes, graphRes] = await Promise.all([
          axios.get('/api/intelligence/dna', { withCredentials: true }),
          axios.get('/api/intelligence/diagnosis', { withCredentials: true }),
          axios.get('/api/intelligence/opportunities', { withCredentials: true }),
          axios.get('/api/intelligence/resume-performance', { withCredentials: true }),
          axios.get('/api/intelligence/market', { withCredentials: true }),
          axios.get('/api/intelligence/twin', { withCredentials: true }),
          axios.get('/api/intelligence/autopilot', { withCredentials: true }),
          axios.get('/api/intelligence/knowledge-graph', { withCredentials: true }),
        ]);
        
        if (dnaRes.data.success) setDna(dnaRes.data.data);
        if (diagRes.data.success) setDiagnosis(diagRes.data.data);
        if (oppRes.data.success) setOpportunities(oppRes.data.data);
        if (resPerfRes.data.success) setResumePerf(resPerfRes.data.data);
        if (marketRes.data.success) setMarket(marketRes.data.data);
        if (twinRes.data.success) setTwin(twinRes.data.data);
        if (autoRes.data.success) setAutopilot(autoRes.data.data);
        if (graphRes.data.success) setGraphData(graphRes.data.data);
        
        await fetchQuestionsOnly();
      } catch (err) {
        console.error('Error fetching intelligence data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchIntelligenceData();
  }, []);

  const tabStyle = (isActive) => ({
    padding: '0.75rem 1.25rem',
    cursor: 'pointer',
    borderBottom: isActive ? '2px solid var(--color-brand-primary)' : '2px solid transparent',
    color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
    fontWeight: isActive ? 600 : 500,
    transition: 'var(--transition)'
  });

  const cardStyle = {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '1rem'
  };

  return (
    <div style={{ paddingTop: '80px', paddingBottom: '3rem', maxWidth: '1200px', margin: '0 auto', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
      
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
          Career Intelligence <span style={{ fontSize: '1rem', padding: '0.2rem 0.5rem', background: 'rgba(99,102,241,0.1)', color: 'var(--color-brand-primary)', borderRadius: '6px', verticalAlign: 'middle', marginLeft: '0.5rem' }}>BETA</span>
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>JobPulse doesn't just track your job search — it learns what works and helps you optimize it.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--color-border)', marginBottom: '2rem', overflowX: 'auto' }}>
        <div style={tabStyle(activeTab === 'overview')} onClick={() => setActiveTab('overview')}>Career Twin & DNA</div>
        <div style={tabStyle(activeTab === 'opportunities')} onClick={() => setActiveTab('opportunities')}>Opportunity Radar</div>
        <div style={tabStyle(activeTab === 'market')} onClick={() => setActiveTab('market')}>Market Insights</div>
        <div style={tabStyle(activeTab === 'resume')} onClick={() => setActiveTab('resume')}>Resume Performance</div>
        <div style={tabStyle(activeTab === 'experiments')} onClick={() => setActiveTab('experiments')}>Career Lab</div>
        <div style={tabStyle(activeTab === 'interviews')} onClick={() => setActiveTab('interviews')}>Interview Knowledge</div>
        <div style={tabStyle(activeTab === 'graph')} onClick={() => setActiveTab('graph')}>Knowledge Graph</div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem', width: '30px', height: '30px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-brand-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          Analyzing your application history...
        </div>
      ) : (
        <>
          {dna?.insufficientData ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--color-surface-raised)', borderRadius: '16px', border: '1px dashed var(--color-border)', marginTop: '2rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🧠</div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.75rem' }}>AI needs more data</h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.05rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
                Career Intelligence gets smarter as you track your job search. Log your first few applications to unlock insights, bottleneck analysis, and JobPulse AI recommendations.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href="/dashboard?view=board" className="btn-primary" style={{ padding: '0.75rem 1.5rem', fontWeight: 700, fontSize: '1rem', borderRadius: '8px', textDecoration: 'none' }}>
                  + Log Application
                </a>
                <a href="/settings" style={{ padding: '0.75rem 1.5rem', fontWeight: 700, fontSize: '1rem', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text-primary)', textDecoration: 'none' }}>
                  Upload Resume
                </a>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              
              {/* CAREER TWIN */}
              <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>🧬</span> Your Career Twin
                </h3>
                
                {twin ? (
                  twin.insufficientData ? (
                    <p style={{ color: 'var(--color-text-secondary)' }}>{twin.message}</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                      <div style={{ background: 'var(--color-surface-raised)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>Target Profile</div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{twin.targetRole}</div>
                      </div>
                      <div style={{ background: 'var(--color-surface-raised)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>Strength</div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{twin.strength}</div>
                      </div>
                      <div style={{ background: 'var(--color-surface-raised)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>Best Strategy</div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-brand-primary)' }}>{twin.bestStrategy}</div>
                      </div>
                      <div style={{ background: 'var(--color-surface-raised)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>Typical Response</div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{twin.typicalResponse}</div>
                      </div>
                      <div style={{ background: 'var(--color-surface-raised)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>Current Bottleneck</div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#f59e0b' }}>{twin.currentBottleneck}</div>
                      </div>
                    </div>
                  )
                ) : (
                  <p>Loading Twin...</p>
                )}
              </div>

              {/* DNA */}
              <div style={cardStyle}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>Job Search DNA</h3>
                {diagnosis?.insufficientData ? (
                  <p style={{ color: 'var(--color-text-secondary)' }}>{diagnosis.message}</p>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', textAlign: 'center' }}>
                      <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{diagnosis?.funnel.applications}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Applied</div>
                      </div>
                      <div style={{ color: 'var(--color-border)' }}>→</div>
                      <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{diagnosis?.funnel.responses}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Responses</div>
                      </div>
                      <div style={{ color: 'var(--color-border)' }}>→</div>
                      <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-brand-primary)' }}>{diagnosis?.funnel.interviews}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-brand-primary)' }}>Interviews</div>
                      </div>
                    </div>
                    <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <h4 style={{ color: '#ef4444', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        ⚠️ Top Bottleneck: {diagnosis?.bottleneck}
                      </h4>
                      <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                        {diagnosis?.explanation}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* DNA Card */}
              <div style={cardStyle}>
                <details open>
                  <summary style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', cursor: 'pointer', outline: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Job Search DNA Data
                    <span className="text-[var(--color-brand-primary)] text-sm">▼</span>
                  </summary>
                  <div className="pt-2">
                    {dna?.insufficientData ? (
                      <p style={{ color: 'var(--color-text-secondary)' }}>{dna.message}</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                          <span style={{ color: 'var(--color-text-secondary)' }}>Overall Response Rate</span>
                          <span style={{ fontWeight: 600 }}>{dna?.responseRate}%</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                          <span style={{ color: 'var(--color-text-secondary)' }}>Interview Conversion</span>
                          <span style={{ fontWeight: 600 }}>{dna?.interviewRate}%</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                          <span style={{ color: 'var(--color-text-secondary)' }}>Best Performing Source</span>
                          <span style={{ fontWeight: 600, color: 'var(--color-brand-primary)' }}>{dna?.bestSource}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--color-text-secondary)' }}>Best Resume Version</span>
                          <span style={{ fontWeight: 600 }}>{dna?.bestResume}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </details>
              </div>

            </div>
          )}

          {activeTab === 'opportunities' && (
            <div style={cardStyle}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>Opportunity Radar</h3>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Applications scored and ranked based on fit, trust signals, and historical performance.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {opportunities.length === 0 ? (
                  <p style={{ color: 'var(--color-text-secondary)' }}>No applications to score yet.</p>
                ) : (
                  opportunities.map(opp => (
                    <div key={opp.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{opp.role}</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>{opp.company} • Status: {opp.status}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: opp.score >= 80 ? 'var(--color-success)' : opp.score >= 60 ? 'var(--color-brand-primary)' : opp.score >= 40 ? 'var(--color-warning)' : 'var(--color-danger)' }}>
                          {opp.score}
                        </div>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                          {opp.category}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'market' && market && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              
              <div style={cardStyle}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>Skill Market Intelligence</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>Aggregated demand from your saved applications.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {market.skillMarket?.map((skill, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '80px', fontWeight: 600 }}>{skill.name}</div>
                      <div style={{ flex: 1, background: 'var(--color-surface-overlay)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'var(--color-brand-primary)', width: `${skill.demand}%` }} />
                      </div>
                      <div style={{ width: '80px', textAlign: 'right', fontSize: '0.8rem', color: skill.userMatch === 'Strong' ? 'var(--color-success)' : skill.userMatch === 'Missing' ? 'var(--color-danger)' : 'var(--color-warning)' }}>
                        {skill.userMatch}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={cardStyle}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>Personal Job Market Map</h3>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <th style={{ padding: '0.5rem 0', color: 'var(--color-text-secondary)' }}>Location</th>
                      <th style={{ padding: '0.5rem 0', color: 'var(--color-text-secondary)' }}>Apps</th>
                      <th style={{ padding: '0.5rem 0', color: 'var(--color-text-secondary)' }}>Response %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {market.locationMap?.map((loc, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                        <td style={{ padding: '0.75rem 0', fontWeight: 500 }}>{loc.location}</td>
                        <td style={{ padding: '0.75rem 0' }}>{loc.applications}</td>
                        <td style={{ padding: '0.75rem 0' }}>{loc.responseRate.toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {market.locationMap?.length === 0 && <p style={{ color: 'var(--color-text-secondary)' }}>No location data available.</p>}
              </div>

              <div style={cardStyle}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>Company Intelligence</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>Companies you've applied to multiple times.</p>
                {market.companyIntelligence?.length === 0 ? (
                  <p style={{ color: 'var(--color-text-secondary)' }}>You haven't applied to any company more than once.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {market.companyIntelligence?.map((c, i) => (
                      <div key={i} style={{ padding: '1rem', background: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{c.company}</span>
                          <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>{c.applications} Apps</span>
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                          Responses: {c.responses} • Interviews: {c.interviews}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={cardStyle}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>Salary Intelligence</h3>
                {market.salaryIntelligence?.totalWithSalary > 0 ? (
                  <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-brand-primary)' }}>
                      ₹{market.salaryIntelligence.average}
                    </div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Average Target Salary</div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '1rem' }}>Based on {market.salaryIntelligence.totalWithSalary} applications with visible compensation.</p>
                  </div>
                ) : (
                  <p style={{ color: 'var(--color-text-secondary)' }}>No applications with salary data found.</p>
                )}
              </div>

            </div>
          )}

          {activeTab === 'resume' && (
            <div>
              <JDMatchWidget />
              <div style={cardStyle}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>Resume Performance Tracking</h3>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                  {resumePerf?.message}
                </p>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <th style={{ padding: '1rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Version</th>
                      <th style={{ padding: '1rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Apps</th>
                      <th style={{ padding: '1rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Response Rate</th>
                      <th style={{ padding: '1rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Interview Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumePerf?.stats?.map((stat, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                        <td style={{ padding: '1rem 0.5rem', fontWeight: 500 }}>{stat.version}</td>
                        <td style={{ padding: '1rem 0.5rem' }}>{stat.applications}</td>
                        <td style={{ padding: '1rem 0.5rem' }}>{(stat.responseRate * 100).toFixed(0)}%</td>
                        <td style={{ padding: '1rem 0.5rem', color: stat.version === resumePerf.topPerformer ? '#10b981' : 'inherit', fontWeight: stat.version === resumePerf.topPerformer ? 700 : 400 }}>
                          {(stat.interviewRate * 100).toFixed(0)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          )}

          {activeTab === 'experiments' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
              
              {/* Strategy Autopilot */}
              {autopilot && autopilot.hasSuggestion && (
                <div style={{ ...cardStyle, border: '2px solid var(--color-brand-primary)', background: 'linear-gradient(135deg, rgba(6,182,212,0.05) 0%, rgba(139,92,246,0.05) 100%)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'inline-block', background: 'var(--gradient-brand)', color: '#fff', fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '12px', textTransform: 'uppercase', marginBottom: '1rem' }}>
                        Strategy Autopilot
                      </div>
                      <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>New Experiment Suggested</h3>
                      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>{autopilot.insight}</p>
                      <div style={{ padding: '1rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', marginBottom: '1rem', fontWeight: 600 }}>
                        {autopilot.suggestion}
                      </div>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <button style={{ background: 'var(--color-brand-primary)', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>Start Experiment</button>
                        <button style={{ background: 'transparent', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>Dismiss</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Career Lab (A/B Testing)</h3>
                  <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>+ New Experiment</button>
                </div>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  You don't have any active experiments yet. Create an experiment to test which application strategy (e.g. Resume A vs Resume B) yields the highest interview conversion.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'interviews' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Personal Interview Question Bank</h3>
                  <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={() => setIsLogQuestionModalOpen(true)}>+ Log Question</button>
                </div>
                {questions.length === 0 ? (
                  <p style={{ color: 'var(--color-text-secondary)' }}>You haven't logged any interview questions yet.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                    {questions.map(q => (
                      <div key={q._id} style={{ padding: '1rem', background: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-brand-primary)' }}>{q.topic}</span>
                          <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>Difficulty: {q.difficulty}/5</span>
                        </div>
                        <p style={{ fontWeight: 700, marginBottom: '0.75rem' }}>{q.question}</p>
                        {q.interview && q.interview.application && (
                          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                            Asked at: {q.interview.application.company} ({new Date(q.interview.scheduledAt).toLocaleDateString()})
                          </div>
                        )}
                        <details style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                          <summary style={{ cursor: 'pointer', fontWeight: 600, outline: 'none' }}>View Answers</summary>
                          <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'var(--color-surface-overlay)', borderRadius: '6px' }}>
                            <strong>Your Answer:</strong><br/>{q.myAnswer || 'Not recorded'}<br/><br/>
                            <strong>Better Answer:</strong><br/>{q.betterAnswer || 'Not recorded'}
                          </div>
                        </details>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'graph' && (
            <div style={cardStyle}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>Your Career Knowledge Graph</h3>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
                A visual representation of how your skills, resumes, and target companies interconnect based on your application history.
              </p>
              
              <div style={{ padding: '2rem', background: 'var(--color-surface-raised)', borderRadius: '12px', border: '1px solid var(--color-border)', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '600px', position: 'relative' }}>
                {graphData.nodes.length <= 1 ? (
                  <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '1rem' }}>KNOWLEDGE GRAPH</h4>
                    <p>Your career network is still developing.</p>
                    <p style={{ marginBottom: '1.5rem' }}>Add applications, skills, resumes, and interview data to unlock more relationships.</p>
                    <button style={{ background: 'var(--color-brand-primary)', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 700 }}>
                      Add Application
                    </button>
                  </div>
                ) : (
                  <div style={{ width: '100%', height: '550px' }}>
                    <ReactFlow 
                      nodes={graphData.nodes} 
                      edges={graphData.edges}
                      fitView
                      minZoom={0.2}
                      maxZoom={1.5}
                      nodesDraggable={true}
                      nodesConnectable={false}
                      elementsSelectable={true}
                      panOnScroll={true}
                      zoomOnScroll={false}
                      preventScrolling={false}
                      zoomOnPinch={true}
                    >
                      <Background color="#ccc" gap={16} />
                      <Controls />
                    </ReactFlow>
                  </div>
                )}
              </div>
            </div>
          )}

        </>
      )}
        </>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />

      <LogInterviewModal 
        isOpen={isLogQuestionModalOpen} 
        onClose={() => setIsLogQuestionModalOpen(false)} 
        onSuccess={fetchQuestionsOnly} 
      />
    </div>
  );
};

export default Intelligence;
