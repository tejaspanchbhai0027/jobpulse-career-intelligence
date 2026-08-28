import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import useDashboardStats from '../hooks/useDashboardStats'

// ── Color palette (matches design system) ──────────────────────────────────────
const STATUS_COLORS = {
  Wishlist:   '#6366f1',
  Applied:    '#06b6d4',
  Assessment: '#f59e0b',
  Interview:  '#8b5cf6',
  Offer:      '#10b981',
  Rejected:   '#ef4444',
}

const CHART_COLORS = Object.values(STATUS_COLORS)

// ── Shared tooltip style ───────────────────────────────────────────────────────
const tooltipStyle = {
  background: 'rgba(17,17,34,0.92)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px',
  color: '#e2e8f0',
  fontSize: '0.8rem',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
}

// ── KPI Stat Card ──────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, color, icon, gradient }) => (
  <div style={{
    background: gradient || `linear-gradient(135deg, ${color}18 0%, ${color}08 100%)`,
    border: `1px solid ${color}30`,
    borderRadius: '16px',
    padding: '1.25rem 1.5rem',
    display: 'flex', flexDirection: 'column', gap: '0.35rem',
    flex: '1 1 160px',
    minWidth: '140px',
    position: 'relative',
    overflow: 'hidden',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 32px ${color}20` }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
  >
    {/* Background icon watermark */}
    <span style={{
      position: 'absolute', right: '0.75rem', top: '0.5rem',
      fontSize: '2.5rem', opacity: 0.07, lineHeight: 1, userSelect: 'none',
    }}>{icon}</span>

    <div style={{ fontSize: '0.7rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
      {label}
    </div>
    <div style={{
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: '2rem', fontWeight: 900,
      letterSpacing: '-0.04em', color: 'var(--color-text-primary)', lineHeight: 1,
    }}>
      {value}
    </div>
    {sub && (
      <div style={{ fontSize: '0.73rem', color: 'var(--color-text-muted)' }}>{sub}</div>
    )}
  </div>
)

// ── Section wrapper ────────────────────────────────────────────────────────────
const ChartSection = ({ title, children, style = {} }) => (
  <div style={{
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '16px',
    padding: '1.5rem',
    ...style,
  }}>
    <div style={{
      fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)',
      textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '1.25rem',
    }}>
      {title}
    </div>
    {children}
  </div>
)

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
const CustomAreaTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={tooltipStyle}>
      <div style={{ padding: '0.6rem 0.9rem' }}>
        <div style={{ fontWeight: 700, marginBottom: '0.25rem', color: '#a5b4fc' }}>{label}</div>
        <div style={{ color: '#e2e8f0' }}>
          {payload[0].value} application{payload[0].value !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  )
}

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const { name, value, payload: p } = payload[0]
  return (
    <div style={tooltipStyle}>
      <div style={{ padding: '0.6rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color }} />
        <span style={{ fontWeight: 600 }}>{name}:</span>
        <span>{value}</span>
      </div>
    </div>
  )
}

// ── Skeleton loader ────────────────────────────────────────────────────────────
const Skeleton = ({ height = '180px', style = {} }) => (
  <div style={{
    height, borderRadius: '12px',
    background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.4s infinite',
    ...style,
  }} />
)

// ── Empty State ────────────────────────────────────────────────────────────────
const EmptyAnalytics = ({ onGoToBoard }) => (
  <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--color-text-muted)' }}>
    <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.4 }}>📊</div>
    <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
      No data yet
    </h3>
    <p style={{ fontSize: '0.875rem', maxWidth: '320px', margin: '0 auto', lineHeight: 1.7, marginBottom: '1.5rem' }}>
      Add a few applications on the Board to see your stats here
    </p>
    <button onClick={onGoToBoard} className="btn-secondary" style={{ fontSize: '0.9rem', padding: '0.6rem 1.25rem' }}>
      Go to Board
    </button>
  </div>
)

// ── Custom Donut Label ─────────────────────────────────────────────────────────
const renderCustomLabel = ({ cx, cy, midAngle, outerRadius, percent, name }) => {
  if (percent < 0.05) return null
  const RADIAN = Math.PI / 180
  const radius = outerRadius * 1.2
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="var(--color-text-secondary)" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="600">
      {name}
    </text>
  )
}

// ── Main Analytics Component ───────────────────────────────────────────────────
const Analytics = ({ onGoToBoard }) => {
  const { stats, loading, error } = useDashboardStats()

  if (loading) {
    return (
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {[1,2,3,4,5].map(i => <Skeleton key={i} height="100px" style={{ flex: '1 1 150px', minWidth: '130px' }} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <Skeleton height="260px" />
          <Skeleton height="260px" />
        </div>
        <Skeleton height="200px" />
        <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '2rem 1.5rem', color: '#fca5a5', fontSize: '0.875rem' }}>
        ⚠️ {error}
      </div>
    )
  }

  if (!stats || stats.total === 0) return <EmptyAnalytics onGoToBoard={onGoToBoard} />

  const {
    byStatus, byMonth, total, responseRate, interviewRate, offerRate,
    followUpCount, activeCount, bySource = [], ghostedCount = 0,
    avgDaysToResponse, avgDaysToInterview, avgDaysToOffer,
    totalInterviews = 0, upcomingInterviewCount = 0,
    sourceConversion = [], weekly = {},
  } = stats

  // Build pie data (exclude zero-count statuses)
  const pieData = Object.entries(byStatus)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value, color: STATUS_COLORS[name] }))

  // Funnel data (ordered pipeline stages, only meaningful ones)
  const funnelData = [
    { stage: 'Wishlist',   count: byStatus.Wishlist,   color: STATUS_COLORS.Wishlist },
    { stage: 'Applied',    count: byStatus.Applied,    color: STATUS_COLORS.Applied },
    { stage: 'Assessment', count: byStatus.Assessment, color: STATUS_COLORS.Assessment },
    { stage: 'Interview',  count: byStatus.Interview,  color: STATUS_COLORS.Interview },
    { stage: 'Offer',      count: byStatus.Offer,      color: STATUS_COLORS.Offer },
    { stage: 'Rejected',   count: byStatus.Rejected,   color: STATUS_COLORS.Rejected },
  ].filter(d => d.count > 0)

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Row 1: Core KPI Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard label="Total Applications" value={total}            sub="all time"            color="#6366f1" icon="📋" />
        <KpiCard label="Active Pipeline"    value={activeCount}      sub="not rejected/closed" color="#06b6d4" icon="🚀" />
        <KpiCard label="Response Rate"      value={`${responseRate}%`} sub="applied → interview" color="#8b5cf6" icon="💬" />
        <KpiCard label="Interview Rate"     value={`${interviewRate}%`} sub="of applications"  color="#f59e0b" icon="🎙️" />
        <KpiCard label="Offers Received"    value={byStatus.Offer}   sub={`${offerRate}% offer rate`}  color="#10b981" icon="🎉" />
        <KpiCard label="Needs Follow-Up"    value={followUpCount}    sub="overdue applications" color="#f59e0b" icon="⚡" />
      </div>

      {/* ── Row 1b: Interview + Time KPI Cards ─────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label="Total Interviews" value={totalInterviews} sub="logged across all apps" color="#8b5cf6" icon="🎙️" />
        <KpiCard label="Upcoming (14d)"   value={upcomingInterviewCount} sub="scheduled interviews"  color="#06b6d4" icon="📅" />
        <KpiCard label="Avg Days → Interview" value={avgDaysToInterview !== null ? `${avgDaysToInterview}d` : '—'} sub="from applied to interview" color="#f59e0b" icon="⏱️" />
        <KpiCard label="Avg Days → Offer"    value={avgDaysToOffer    !== null ? `${avgDaysToOffer}d`    : '—'} sub="from applied to offer"    color="#10b981" icon="🏆" />
      </div>

      {/* ── Row 2: Area Chart + Pie Chart ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-[1.8fr_1fr] gap-6">
        {/* Area Chart - Applications over time */}
        <ChartSection title="📈 Applications Over Time (last 12 months)">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={byMonth} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                axisLine={false} tickLine={false}
                interval={1}
              />
              <YAxis
                tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                axisLine={false} tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomAreaTooltip />} cursor={{ stroke: 'rgba(99,102,241,0.3)', strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                strokeWidth={2.5}
                fill="url(#areaGradient)"
                dot={{ fill: '#6366f1', r: 3, strokeWidth: 0 }}
                activeDot={{ fill: '#a5b4fc', r: 5, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartSection>

        {/* Pie/Donut Chart - Status distribution */}
        <ChartSection title="🍩 Status Distribution">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={78}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem', justifyContent: 'center' }}>
              {pieData.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                  <span style={{ fontWeight: 600 }}>{d.name}</span>
                  <span style={{ color: 'var(--color-text-muted)' }}>({d.value})</span>
                </div>
              ))}
            </div>
          </div>
        </ChartSection>
      </div>

      {/* ── Row 3: Application Funnel ─────────────────────────────────────────── */}
      <ChartSection title="🔻 Application Funnel">
        <ResponsiveContainer width="100%" height={Math.max(funnelData.length * 46, 140)}>
          <BarChart
            layout="vertical"
            data={funnelData}
            margin={{ top: 0, right: 40, left: 80, bottom: 0 }}
            barSize={20}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
              axisLine={false} tickLine={false}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="stage"
              tick={{ fill: 'var(--color-text-secondary)', fontSize: 12, fontWeight: 600 }}
              axisLine={false} tickLine={false}
              width={78}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload
                return (
                  <div style={tooltipStyle}>
                    <div style={{ padding: '0.6rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color }} />
                      <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{d.stage}</span>
                      <span style={{ color: '#a5b4fc' }}>{d.count} app{d.count !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                )
              }}
            />
            <Bar dataKey="count" radius={[0, 6, 6, 0]}>
              {funnelData.map((entry) => (
                <Cell key={entry.stage} fill={entry.color} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartSection>

      {/* ── Row 4: Success Metrics Bar Chart ─────────────────────────────────── */}
      <ChartSection title="🎯 Conversion Rates">
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Response Rate', value: responseRate, color: '#8b5cf6', desc: 'Applications that got a response' },
            { label: 'Interview Rate', value: interviewRate, color: '#06b6d4', desc: 'Applications that led to an interview' },
            { label: 'Offer Rate',    value: offerRate,    color: '#10b981', desc: 'Applications that converted to offers' },
          ].map(({ label, value, color, desc }) => (
            <div key={label} style={{ flex: '1 1 180px', minWidth: '160px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>{label}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 900, color, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{value}%</span>
              </div>
              {/* Progress bar */}
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${Math.min(value, 100)}%`,
                  background: `linear-gradient(90deg, ${color}aa, ${color})`,
                  borderRadius: '999px',
                  transition: 'width 0.8s cubic-bezier(0.25, 1, 0.5, 1)',
                  boxShadow: `0 0 8px ${color}60`,
                }} />
              </div>
              <div style={{ marginTop: '0.4rem', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{desc}</div>
            </div>
          ))}
        </div>
      </ChartSection>

      {/* ── Row 5: Source Breakdown (count chart) ──────────────────────────── */}
      {bySource.length > 0 && (
        <ChartSection title="📡 Applications by Source">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={bySource} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="source" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
              <Bar dataKey="count" name="Applications" radius={[6, 6, 0, 0]}>
                {bySource.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartSection>
      )}

      {/* ── Row 6: Source Conversion Table ─────────────────────────────────── */}
      {sourceConversion.length > 0 && (
        <ChartSection title="📊 Source Conversion Rates">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Source', 'Total', 'Responses', 'Interviews', 'Offers', 'Response %', 'Offer %'].map(h => (
                    <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sourceConversion.map((s, i) => (
                  <tr key={s.source} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{s.source}</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: 'var(--color-text-secondary)' }}>{s.total}</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: 'var(--color-text-secondary)' }}>{s.responses}</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#a5b4fc' }}>{s.interviews}</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#6ee7b7' }}>{s.offers}</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', minWidth: '60px' }}>
                          <div style={{ height: '100%', width: `${s.responseRate}%`, background: '#8b5cf6', borderRadius: '999px', transition: 'width 0.6s ease' }} />
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#a5b4fc', minWidth: '34px' }}>{s.responseRate}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', minWidth: '60px' }}>
                          <div style={{ height: '100%', width: `${s.offerRate}%`, background: '#10b981', borderRadius: '999px', transition: 'width 0.6s ease' }} />
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6ee7b7', minWidth: '34px' }}>{s.offerRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartSection>
      )}

      {/* ── Row 7: Weekly Activity Snapshot ────────────────────────────────── */}
      {(weekly.applications !== undefined) && (
        <ChartSection title="📅 This Week's Activity">
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Applications Added',    value: weekly.applications, color: '#6366f1', icon: '📋' },
              { label: 'Interviews Scheduled',  value: weekly.interviews,   color: '#8b5cf6', icon: '🎙️' },
              { label: 'Offers Received',       value: weekly.offers,       color: '#10b981', icon: '🎉' },
              { label: 'Ghosted (All Time)',     value: ghostedCount,        color: '#9ca3af', icon: '👻' },
            ].map(({ label, value, color, icon }) => (
              <div key={label} style={{
                flex: '1 1 160px', minWidth: '130px',
                padding: '1rem 1.25rem',
                background: `${color}10`,
                border: `1px solid ${color}25`,
                borderRadius: '12px',
                display: 'flex', alignItems: 'center', gap: '0.85rem',
              }}>
                <span style={{ fontSize: '1.5rem' }}>{icon}</span>
                <div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color, fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1 }}>{value ?? 0}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        </ChartSection>
      )}

      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}

export default Analytics
