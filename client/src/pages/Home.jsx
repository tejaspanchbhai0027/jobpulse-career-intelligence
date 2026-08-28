import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

/* ── Mini Components ───────────────────────────────────────────────────────── */

const StatBadge = ({ value, label }) => (
  <div style={{
    textAlign: 'center',
    padding: '1.25rem 1.5rem',
    background: 'var(--color-surface-raised)',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    minWidth: '120px',
  }}>
    <div style={{ fontSize: '1.75rem', fontWeight: 800, background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
      {value}
    </div>
    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 500, marginTop: '0.2rem' }}>
      {label}
    </div>
  </div>
)

const FeatureCard = ({ icon, title, description, color }) => (
  <div
    className="glass-card"
    style={{
      padding: '2rem',
      transition: 'var(--transition)',
      cursor: 'default',
      position: 'relative',
      overflow: 'hidden',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-6px)'
      e.currentTarget.style.borderColor = color + '55'
      e.currentTarget.style.boxShadow = `0 20px 40px rgba(0,0,0,0.3), 0 0 0 1px ${color}33`
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.borderColor = 'var(--color-border)'
      e.currentTarget.style.boxShadow = 'none'
    }}
  >
    <div style={{
      width: '48px',
      height: '48px',
      borderRadius: '12px',
      background: color + '22',
      border: `1px solid ${color}44`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '1.25rem',
      fontSize: '1.5rem',
    }}>
      {icon}
    </div>
    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.6rem' }}>
      {title}
    </h3>
    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
      {description}
    </p>
    {/* Accent line */}
    <div style={{
      position: 'absolute',
      top: 0, left: '2rem',
      width: '40px', height: '2px',
      background: color,
      borderRadius: '0 0 4px 4px',
    }} />
  </div>
)

const StepCard = ({ number, title, description }) => (
  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
    <div style={{
      flexShrink: 0,
      width: '44px', height: '44px',
      borderRadius: '12px',
      background: 'var(--gradient-brand)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: '1rem', color: '#fff',
      boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
    }}>
      {number}
    </div>
    <div>
      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
        {title}
      </h4>
      <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
        {description}
      </p>
    </div>
  </div>
)

/* ── Mock Kanban Preview ───────────────────────────────────────────────────── */

const KanbanPreview = () => {
  const columns = [
    { label: 'Applied', color: 'var(--color-applied)', cards: ['Software Engineer @ Google', 'Frontend Dev @ Stripe'] },
    { label: 'Interview', color: 'var(--color-interview)', cards: ['Full Stack Dev @ Vercel'] },
    { label: 'Offer 🎉', color: 'var(--color-offer)', cards: ['React Dev @ Shopify'] },
  ]
  return (
    <div style={{
      display: 'flex', gap: '0.85rem',
      padding: '1.5rem',
      background: 'var(--color-surface)',
      borderRadius: '16px',
      border: '1px solid var(--color-border)',
      overflowX: 'auto',
      minHeight: '220px',
    }}>
      {columns.map(col => (
        <div key={col.label} style={{ flex: '1', minWidth: '170px' }}>
          <div style={{
            fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.1em', color: col.color,
            marginBottom: '0.75rem', paddingBottom: '0.5rem',
            borderBottom: `2px solid ${col.color}33`,
            display: 'flex', alignItems: 'center', gap: '0.4rem',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: col.color, display: 'inline-block' }} />
            {col.label}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {col.cards.map(card => (
              <div key={card} style={{
                padding: '0.75rem 0.9rem',
                background: 'var(--color-surface-raised)',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '0.8rem',
                fontWeight: 500,
                color: 'var(--color-text-primary)',
                cursor: 'grab',
                transition: 'var(--transition)',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = col.color + '88'
                  e.currentTarget.style.transform = 'translateX(3px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--color-border)'
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
              >
                {card}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Nudge Alert Preview ───────────────────────────────────────────────────── */

const NudgeAlert = () => (
  <div style={{
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.85rem',
    padding: '1rem 1.25rem',
    background: 'rgba(245,158,11,0.08)',
    border: '1px solid rgba(245,158,11,0.3)',
    borderRadius: '12px',
    marginTop: '1rem',
  }}>
    <div style={{ fontSize: '1.25rem', lineHeight: 1 }}>⚡</div>
    <div>
      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b', marginBottom: '0.2rem' }}>
        Follow-Up Reminder
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
        Your application to <strong style={{ color: 'var(--color-text-primary)' }}>Software Engineer @ Google</strong> has been sitting for <strong style={{ color: '#f59e0b' }}>9 days</strong> with no update. Time to follow up!
      </div>
    </div>
  </div>
)

/* ── Main Home Page ────────────────────────────────────────────────────────── */

const Home = () => {
  return (
    <main style={{ overflowX: 'hidden' }}>

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8rem 1.5rem 5rem',
          position: 'relative',
          textAlign: 'center',
        }}
      >
        {/* Background radial glow */}
        <div style={{
          position: 'absolute',
          top: '30%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px', height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.1) 40%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }} />

        {/* Badge */}
        <div
          className="animate-slide-up"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.35)',
            borderRadius: '999px',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#a5b4fc',
            marginBottom: '1.5rem',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1', display: 'inline-block', animation: 'pulse-glow 2s infinite' }} />
          Smart Job Application Tracker
        </div>

        {/* Headline */}
        <h1
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            color: 'var(--color-text-primary)',
            maxWidth: '800px',
            marginBottom: '1.5rem',
            position: 'relative',
            zIndex: 1,
          }}
        >
          Never miss a{' '}
          <span className="gradient-text">follow-up</span>
          <br />opportunity again.
        </h1>

        {/* Sub-headline */}
        <p
          style={{
            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
            color: 'var(--color-text-secondary)',
            maxWidth: '560px',
            lineHeight: 1.75,
            marginBottom: '2.5rem',
            position: 'relative',
            zIndex: 1,
          }}
        >
          JobPulse tracks every application through your hiring pipeline and
          automatically reminds you when a job goes stale — before the
          opportunity passes you by.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10 w-full sm:w-auto px-4 sm:px-0">
          <Link to="/register" className="btn-primary w-full sm:w-auto" style={{ textDecoration: 'none', fontSize: '1rem', padding: '0.85rem 2rem' }}>
            Start Tracking Free →
          </Link>
          <a href="#features" className="btn-secondary w-full sm:w-auto" style={{ fontSize: '1rem', padding: '0.85rem 2rem', textDecoration: 'none', display: 'inline-block' }}>
            See Features
          </a>
        </div>

        {/* Stats Row */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginTop: '4rem',
          position: 'relative',
          zIndex: 1,
        }}>
          <StatBadge value="6" label="Pipeline Stages" />
          <StatBadge value="7d" label="Auto Follow-Up" />
          <StatBadge value="∞" label="Applications" />
          <StatBadge value="100%" label="Free to Use" />
        </div>

        {/* Kanban Preview Card */}
        <div
          style={{
            marginTop: '4rem',
            width: '100%',
            maxWidth: '780px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
            marginBottom: '0.75rem',
          }}>
            Live Pipeline Preview
          </div>
          <div className="animate-float">
            <KanbanPreview />
            <NudgeAlert />
          </div>
        </div>
      </section>

      {/* ── Features Section ─────────────────────────────────────────────── */}
      <section id="features" style={{ padding: '6rem 1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <h2 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            marginBottom: '1rem',
          }}>
            Everything you need to{' '}
            <span className="gradient-text">land the job</span>
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.05rem', maxWidth: '520px', margin: '0 auto' }}>
            Built specifically for active job seekers juggling 10+ applications.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
        }}>
          <FeatureCard
            icon="📋"
            title="Application CRUD"
            description="Log any job in under 30 seconds. Track company, role, URL, status, notes, and contact info all in one place."
            color="var(--color-brand-primary)"
          />
          <FeatureCard
            icon="🗂️"
            title="Kanban Pipeline Board"
            description="Drag and drop applications across 6 stages — Wishlist, Applied, Assessment, Interview, Offer, and Rejected."
            color="var(--color-brand-secondary)"
          />
          <FeatureCard
            icon="⚡"
            title="Follow-Up Nudge Engine"
            description="A daily cron job flags applications stuck in 'Applied' for 7+ days and emails you before the window closes."
            color="var(--color-brand-accent)"
          />
          <FeatureCard
            icon="📊"
            title="Dashboard Analytics"
            description="Charts for applications per week, status breakdown, and average response time so you can optimize your approach."
            color="#f59e0b"
          />
          <FeatureCard
            icon="🔍"
            title="Search & Filter"
            description="Instantly find any application by company name, status stage, or date range applied."
            color="#10b981"
          />
          <FeatureCard
            icon="⚙️"
            title="Configurable Reminders"
            description="Set your follow-up window globally or per application. 3 days for hot roles, 14 days for passive ones."
            color="#ef4444"
          />
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: '6rem 1.5rem', background: 'var(--color-surface)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              marginBottom: '1rem',
            }}>
              How <span className="gradient-text">JobPulse</span> works
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <StepCard
              number="1"
              title="Log your application"
              description="Add any job in seconds — company, role, status, date applied, and notes. Your personal pipeline lives in the cloud."
            />
            <div style={{ width: '2px', height: '24px', background: 'var(--color-border)', marginLeft: '21px' }} />
            <StepCard
              number="2"
              title="Visualize your pipeline"
              description="Drag cards between stages on your Kanban board. See exactly where every application stands at a glance."
            />
            <div style={{ width: '2px', height: '24px', background: 'var(--color-border)', marginLeft: '21px' }} />
            <StepCard
              number="3"
              title="Get nudged automatically"
              description="JobPulse's engine runs daily and emails you when any application has gone quiet for too long — so you never miss a follow-up window."
            />
            <div style={{ width: '2px', height: '24px', background: 'var(--color-border)', marginLeft: '21px' }} />
            <StepCard
              number="4"
              title="Track your momentum"
              description="The dashboard shows your weekly application velocity, response rate, and conversion through each stage."
            />
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────── */}
      <section style={{
        padding: '6rem 1.5rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.15) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />
        <h2 style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
          fontWeight: 800,
          letterSpacing: '-0.025em',
          marginBottom: '1rem',
          position: 'relative',
          zIndex: 1,
        }}>
          Ready to take control of your <span className="gradient-text">job search?</span>
        </h2>
        <p style={{
          color: 'var(--color-text-secondary)',
          fontSize: '1.05rem',
          marginBottom: '2rem',
          position: 'relative', zIndex: 1,
        }}>
          Free forever. No credit card required.
        </p>
        <Link
          to="/register"
          className="btn-primary"
          style={{ textDecoration: 'none', fontSize: '1.05rem', padding: '0.9rem 2.25rem', position: 'relative', zIndex: 1, display: 'inline-block' }}
        >
          Create Your Free Account →
        </Link>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid var(--color-border)',
        padding: '2rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        maxWidth: '1100px',
        margin: '0 auto',
      }}>
        <div style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 700,
          fontSize: '1rem',
          color: 'var(--color-text-secondary)',
        }}>
          Job<span className="gradient-text">Pulse</span>
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
          © {new Date().getFullYear()} JobPulse. Built with MERN stack.
        </div>
      </footer>
    </main>
  )
}

export default Home
