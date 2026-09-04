import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ department: '', batch: '', startDate: '', endDate: '' });
  const [exporting, setExporting] = useState(false);

  const departments = ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering'];
  const batches = [2024, 2025];

  const fetchData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const p = new URLSearchParams();
      Object.entries(filters).forEach(([k,v]) => { if (v) p.append(k, v); });
      const res = await api.get(`/admin/analytics?${p.toString()}`);
      if (res.data.success) setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics.');
    } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { const t = setTimeout(fetchData, 350); return () => clearTimeout(t); }, [fetchData]);

  const handleFilter = (e) => setFilters(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleExport = async () => {
    setExporting(true);
    try {
      const p = new URLSearchParams();
      Object.entries(filters).forEach(([k,v]) => { if (v) p.append(k, v); });
      const res = await api.get(`/admin/analytics/export?${p.toString()}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url;
      a.download = `jobpulse-analytics-${Date.now()}.csv`; a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) { console.error(err); }
    finally { setExporting(false); }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>

      {/* ── FILTERS ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', background: 'var(--color-surface)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--color-border)', marginBottom: '2rem', boxShadow: 'var(--shadow-card)' }}>
        <select name="department" value={filters.department} onChange={handleFilter} style={inputSt}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select name="batch" value={filters.batch} onChange={handleFilter} style={inputSt}>
          <option value="">All Batches</option>
          {batches.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <input type="date" name="startDate" value={filters.startDate} onChange={handleFilter} style={inputSt} />
        <input type="date" name="endDate" value={filters.endDate} onChange={handleFilter} style={inputSt} />
        {(filters.department || filters.batch || filters.startDate || filters.endDate) && (
          <button onClick={() => setFilters({ department:'',batch:'',startDate:'',endDate:'' })}
            style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', borderRadius: '8px', padding: '0.6rem 1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
            Clear Filters
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button
          onClick={handleExport} disabled={exporting || !data}
          style={{ background: 'var(--color-brand-primary)', color: '#fff', border: 'none', borderRadius: '10px', padding: '0.6rem 1.2rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', opacity: exporting ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {exporting ? '⏳ Exporting...' : '📥 Export CSV'}
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 500 }}>{error}</div>
      )}

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Computing analytics...</div>
      ) : !data ? null : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* ── META STRIP ─────────────────────────────────── */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Students', value: data.meta.totalStudents },
              { label: 'Active Seekers', value: data.meta.activeStudents },
              { label: 'Applications', value: data.meta.totalApplications },
              { label: 'Interviews', value: data.meta.totalInterviews, accent: true },
              { label: 'Offers', value: data.meta.totalOffers, green: true },
            ].map(s => (
              <div key={s.label} style={{ flex: '1 1 140px', background: 'var(--color-surface)', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '1.25rem 1.5rem', textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ fontSize: '2.25rem', fontWeight: 900, lineHeight: 1, color: s.green ? 'var(--color-success)' : s.accent ? 'var(--color-brand-primary)' : 'var(--color-text-primary)' }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--color-text-muted)', marginTop: '0.4rem', letterSpacing: '0.06em' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── PLACEMENT FUNNEL ───────────────────────────── */}
          <Section title="Placement Funnel" subtitle={`${data.meta.filters.department === 'All' ? 'All departments' : data.meta.filters.department} • Batch: ${data.meta.filters.batch === 'All' ? 'All' : data.meta.filters.batch}`}>
            {data.funnel ? <FunnelChart funnel={data.funnel} /> : <EmptyState />}
          </Section>

          {/* ── TRENDS ─────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <Section title="Application Trend" subtitle="Monthly applications submitted">
              <TrendBars data={data.applicationTrend} valueKey="applications" color="var(--color-brand-primary)" />
            </Section>
            <Section title="Interview Trend" subtitle="Monthly interviews scheduled">
              <TrendBars data={data.interviewTrend} valueKey="interviews" color="#7C3AED" />
            </Section>
          </div>

          {/* ── OFFER TREND ─────────────────────────────────── */}
          <Section title="Offer Trend" subtitle="Monthly offers received">
            <TrendBars data={data.offerTrend} valueKey="offers" color="var(--color-success)" tall />
          </Section>

          {/* ── DEPARTMENT COMPARISON ──────────────────────── */}
          <Section title="Department Comparison" subtitle={`Population: ${data.meta.totalStudents} students`}>
            <ComparisonTable rows={data.byDepartment} groupKey="department" />
          </Section>

          {/* ── BATCH COMPARISON ───────────────────────────── */}
          <Section title="Batch Comparison" subtitle="Grouped by graduation year">
            <ComparisonTable rows={data.byBatch} groupKey="batch" />
          </Section>

          {/* ── APPLICATION SOURCE ─────────────────────────── */}
          <Section title="Application Source Performance" subtitle="Based on job postings collected in JobPulse">
            <SourceTable rows={data.bySource} />
          </Section>

          {/* ── SKILL DEMAND ───────────────────────────────── */}
          <Section title="Skill Demand" subtitle="Skills extracted from employer job descriptions in JobPulse">
            <SkillCloud skills={data.skillDemand} />
          </Section>

          {/* ── RESUME PERFORMANCE ─────────────────────────── */}
          {data.resumePerformance && data.resumePerformance.length > 0 && (
            <Section title="Resume Target Distribution" subtitle="Aggregate resume target roles (no individual data exposed)">
              <SourceTable rows={data.resumePerformance.map(r => ({ source: r.targetRole, applications: r.resumeCount, interviews: null, offers: null, responseRate: null }))} hideRates />
            </Section>
          )}
        </div>
      )}
    </div>
  );
};

// ── SECTION WRAPPER ─────────────────────────────────────────────
const Section = ({ title, subtitle, children }) => (
  <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '2rem', boxShadow: 'var(--shadow-card)' }}>
    <div style={{ marginBottom: '1.75rem' }}>
      <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 0.25rem 0', letterSpacing: '-0.01em' }}>{title}</h2>
      {subtitle && <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0, fontWeight: 500 }}>{subtitle}</p>}
    </div>
    {children}
  </div>
);

const EmptyState = () => (
  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No data available for selected filters.</div>
);

// ── FUNNEL CHART ────────────────────────────────────────────────
const FunnelChart = ({ funnel }) => {
  const maxCount = funnel.stages[0]?.count || 1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {funnel.stages.map((stage, i) => {
        const pct = Math.round((stage.count / maxCount) * 100);
        return (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>{stage.label}</div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--color-text-primary)' }}>{stage.count.toLocaleString()}</span>
                {stage.rate && (
                  <span style={{
                    background: stage.rate.value !== null ? 'rgba(37,99,235,0.1)' : 'var(--color-bg)',
                    color: stage.rate.value !== null ? 'var(--color-brand-primary)' : 'var(--color-text-muted)',
                    padding: '3px 10px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700,
                    border: '1px solid var(--color-border)'
                  }}>
                    {stage.rate.value !== null ? `${stage.rate.label} conversion` : `⚠ ${stage.rate.label} (n=${stage.rate.n})`}
                  </span>
                )}
              </div>
            </div>
            <div style={{ height: '12px', background: 'var(--color-bg)', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: `hsl(${220 - i * 20},75%,55%)`, borderRadius: '6px', transition: 'width 0.6s ease' }} />
            </div>
          </div>
        );
      })}

      {/* Summary rates */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)', flexWrap: 'wrap' }}>
        {Object.entries(funnel.summary).map(([key, rate]) => (
          <div key={key} style={{ flex: 1, minWidth: '140px', background: 'var(--color-bg)', borderRadius: '10px', padding: '1rem', textAlign: 'center', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: rate.value !== null ? '1.75rem' : '1rem', fontWeight: 900, color: rate.value !== null ? 'var(--color-brand-primary)' : 'var(--color-text-muted)' }}>
              {rate.value !== null ? rate.label : '—'}
            </div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700, marginTop: '0.3rem', letterSpacing: '0.05em' }}>
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </div>
            {rate.value === null && <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>n={rate.n} (need ≥5)</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── TREND BARS ──────────────────────────────────────────────────
const TrendBars = ({ data, valueKey, color, tall }) => {
  if (!data || data.length === 0) return <EmptyState />;
  const maxVal = Math.max(...data.map(d => d[valueKey] || 0), 1);
  const height = tall ? 140 : 100;

  return (
    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-end', height: `${height + 30}px`, overflowX: 'auto', paddingBottom: '4px' }}>
      {data.map((item, i) => {
        const barH = Math.round(((item[valueKey] || 0) / maxVal) * height);
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '42px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>{item[valueKey] || 0}</div>
            <div style={{ width: '32px', height: `${barH || 4}px`, background: color, borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease', opacity: 0.9 }} />
            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {MONTHS[(item.month || 1) - 1]} {String(item.year).slice(2)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── COMPARISON TABLE ────────────────────────────────────────────
const ComparisonTable = ({ rows, groupKey }) => {
  if (!rows || rows.length === 0) return <EmptyState />;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
            {[groupKey.charAt(0).toUpperCase() + groupKey.slice(1), 'Students', 'Applications', 'Interviews', 'Offers', 'Placement Rate'].map(h => (
              <th key={h} style={thSt}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td style={{ ...tdSt, fontWeight: 800, color: 'var(--color-text-primary)' }}>{row[groupKey]}</td>
              <td style={tdSt}>{row.students}</td>
              <td style={tdSt}>{row.applications}</td>
              <td style={{ ...tdSt, color: row.interviews > 0 ? 'var(--color-brand-primary)' : 'var(--color-text-muted)', fontWeight: row.interviews > 0 ? 700 : 400 }}>{row.interviews}</td>
              <td style={tdSt}>
                {row.offers > 0 ? (
                  <span style={{ background: 'rgba(22,163,74,0.1)', color: 'var(--color-success)', padding: '3px 10px', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem' }}>{row.offers}</span>
                ) : <span style={{ color: 'var(--color-text-muted)' }}>0</span>}
              </td>
              <td style={tdSt}>
                {row.placementRate.value !== null
                  ? <span style={{ fontWeight: 700, color: row.placementRate.value >= 50 ? 'var(--color-success)' : 'var(--color-text-primary)' }}>{row.placementRate.label}</span>
                  : <span style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', fontStyle: 'italic' }}>Insufficient data (n={row.placementRate.n})</span>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── SOURCE TABLE ────────────────────────────────────────────────
const SourceTable = ({ rows, hideRates }) => {
  if (!rows || rows.length === 0) return <EmptyState />;
  const maxApps = Math.max(...rows.map(r => r.applications || r.resumeCount || 0), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {rows.map((row, i) => {
        const count = row.applications || row.resumeCount || 0;
        const pct = Math.round((count / maxApps) * 100);
        return (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '160px 1fr auto', gap: '1rem', alignItems: 'center' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.source || row.targetRole}</div>
            <div style={{ height: '8px', background: 'var(--color-bg)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: 'var(--color-brand-primary)', borderRadius: '4px' }} />
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>{count} {hideRates ? 'resumes' : 'apps'}</span>
              {!hideRates && row.responseRate && (
                row.responseRate.value !== null
                  ? <span style={{ color: 'var(--color-brand-primary)', fontWeight: 700 }}>{row.responseRate.label} response</span>
                  : <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: '0.8rem' }}>Insufficient data</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── SKILL CLOUD ─────────────────────────────────────────────────
const SkillCloud = ({ skills }) => {
  if (!skills || skills.length === 0) return <EmptyState />;
  const max = skills[0]?.count || 1;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
      {skills.map((s, i) => {
        const intensity = s.count / max;
        const opacity = 0.3 + intensity * 0.7;
        const scale = 0.82 + intensity * 0.4;
        return (
          <div key={i} title={`${s.count} job postings`} style={{ background: `rgba(37,99,235,${opacity * 0.14})`, border: `1px solid rgba(37,99,235,${opacity * 0.4})`, color: `rgba(37,99,235,${0.6 + intensity * 0.4})`, padding: '5px 13px', borderRadius: '20px', fontSize: `${scale}rem`, fontWeight: 700, cursor: 'default' }}>
            {s.skill} <span style={{ fontWeight: 400, opacity: 0.7, fontSize: '0.85em' }}>{s.count}</span>
          </div>
        );
      })}
    </div>
  );
};

// ── SHARED STYLES ───────────────────────────────────────────────
const inputSt = { background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.92rem', outline: 'none', fontWeight: 500 };
const thSt = { padding: '0.875rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' };
const tdSt = { padding: '1rem', fontSize: '0.95rem', color: 'var(--color-text-secondary)' };

export default AdminAnalytics;
