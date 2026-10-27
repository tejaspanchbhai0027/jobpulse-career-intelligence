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
    minWidth: '130px',
  }}>
    <div style={{ fontSize: '1.75rem', fontWeight: 800, background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
      {value}
    </div>
    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 500, marginTop: '0.2rem' }}>
      {label}
    </div>
  </div>
)

const PortalCard = ({ icon, role, title, description, color }) => (
  <div
    className="glass-card"
    style={{
      padding: '2.5rem 2rem',
      transition: 'var(--transition)',
      cursor: 'default',
      position: 'relative',
      overflow: 'hidden',
      border: '1px solid var(--color-border)',
      background: 'var(--color-surface)',
      borderRadius: '16px',
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
      width: '56px',
      height: '56px',
      borderRadius: '16px',
      background: color + '22',
      border: `1px solid ${color}44`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '1.5rem',
      fontSize: '1.8rem',
    }}>
      {icon}
    </div>
    <div style={{ fontSize: '0.85rem', fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
      For {role}
    </div>
    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '1rem', lineHeight: 1.3 }}>
      {title}
    </h3>
    <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
      {description}
    </p>
    {/* Accent line */}
    <div style={{
      position: 'absolute',
      top: 0, left: '2rem',
      width: '40px', height: '3px',
      background: color,
      borderRadius: '0 0 4px 4px',
    }} />
  </div>
)

const StepCard = ({ number, title, description }) => (
  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
    <div style={{
      flexShrink: 0,
      width: '48px', height: '48px',
      borderRadius: '14px',
      background: 'var(--gradient-brand)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-white)',
      boxShadow: '0 4px 16px var(--color-brand-primary-shadow)',
    }}>
      {number}
    </div>
    <div>
      <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.4rem' }}>
        {title}
      </h4>
      <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
        {description}
      </p>
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
          top: '40%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '800px', height: '800px',
          borderRadius: '50%',
          background: 'var(--gradient-radial-glow)',
          pointerEvents: 'none',
          zIndex: 0,
        }} />

        {/* Badge */}
        <div
          className="animate-slide-up"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.5rem 1.25rem',
            background: 'var(--color-brand-primary-light)',
            border: '1px solid var(--color-brand-primary-border)',
            borderRadius: '999px',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: 'var(--color-brand-primary)',
            marginBottom: '2rem',
            position: 'relative',
            zIndex: 1,
            boxShadow: '0 4px 12px rgba(37,99,235,0.1)'
          }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-brand-primary)', display: 'inline-block', animation: 'pulse-glow 2s infinite' }} />
          The Intelligent Placement Platform
        </div>

        {/* Headline */}
        <h1
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: 900,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            color: 'var(--color-text-primary)',
            maxWidth: '900px',
            marginBottom: '1.5rem',
            position: 'relative',
            zIndex: 1,
          }}
        >
          Unify your campus <br />
          <span className="gradient-text">placement ecosystem.</span>
        </h1>

        {/* Sub-headline */}
        <p
          style={{
            fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
            color: 'var(--color-text-secondary)',
            maxWidth: '650px',
            lineHeight: 1.7,
            marginBottom: '3rem',
            position: 'relative',
            zIndex: 1,
          }}
        >
          JobPulse connects Placement Officers, Mentors, and Students on a single, AI-powered platform to drive career readiness, track applications, and maximize placement success.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10 w-full sm:w-auto px-4 sm:px-0">
          <Link to="/register" className="btn-primary w-full sm:w-auto" style={{ textDecoration: 'none', fontSize: '1.05rem', padding: '0.9rem 2.25rem' }}>
            Get Started Free →
          </Link>
          <a href="#portals" className="btn-secondary w-full sm:w-auto" style={{ fontSize: '1.05rem', padding: '0.9rem 2.25rem', textDecoration: 'none', display: 'inline-block' }}>
            Explore Portals
          </a>
        </div>

        {/* Stats Row */}
        <div style={{
          display: 'flex',
          gap: '1.5rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginTop: '5rem',
          position: 'relative',
          zIndex: 1,
        }}>
          <StatBadge value="3" label="Dedicated Portals" />
          <StatBadge value="1" label="Unified Database" />
          <StatBadge value="AI" label="Career Copilot" />
          <StatBadge value="100%" label="Visibility" />
        </div>
      </section>

      {/* ── Portals Section ─────────────────────────────────────────────── */}
      <section id="portals" style={{ padding: '6rem 1.5rem', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            marginBottom: '1.25rem',
          }}>
            One Platform.{' '}
            <span className="gradient-text">Three Experiences.</span>
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
            Purpose-built tools for every stakeholder in the placement journey.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
        }}>
          <PortalCard
            icon="🎓"
            role="Students"
            title="Execute & Prepare"
            description="A personal command center to track applications, practice with AI mock interviews, build readiness scores, and manage placement drives."
            color="var(--color-brand-primary)"
          />
          <PortalCard
            icon="👥"
            role="Mentors"
            title="Monitor & Guide"
            description="Cohort dashboards to monitor student progress, track early intervention signals, review private notes, and guide students to success."
            color="#10b981"
          />
          <PortalCard
            icon="🏢"
            role="Placement Officers"
            title="Manage & Coordinate"
            description="The institutional command center to broadcast placement drives, verify offers, analyze global analytics, and manage the entire pipeline."
            color="#8b5cf6"
          />
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: '7rem 1.5rem', background: 'var(--color-surface)' }}>
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              marginBottom: '1.25rem',
            }}>
              How <span className="gradient-text">JobPulse</span> flows
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
              Seamless data synchronization from the first application to the final offer.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            <StepCard
              number="1"
              title="Institution Connection"
              description="Placement Officers set up the workspace. Mentors are onboarded, and Students seamlessly request connection to join their assigned cohort."
            />
            <div style={{ width: '2px', height: '30px', background: 'var(--color-border)', marginLeft: '23px' }} />
            <StepCard
              number="2"
              title="Preparation & Readiness"
              description="Students leverage the AI Career Copilot to analyze their resume, take mock interviews, and build their Career Readiness profile."
            />
            <div style={{ width: '2px', height: '30px', background: 'var(--color-border)', marginLeft: '23px' }} />
            <StepCard
              number="3"
              title="Execution & Monitoring"
              description="Students log applications and register for drives. Mentors instantly see cohort activity and act on automated Intervention Signals when students get stuck."
            />
            <div style={{ width: '2px', height: '30px', background: 'var(--color-border)', marginLeft: '23px' }} />
            <StepCard
              number="4"
              title="Verification & Success"
              description="As offers roll in, Placement Officers verify placements and monitor real-time institutional analytics to report on placement success."
            />
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────── */}
      <section style={{
        padding: '7rem 1.5rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <h2 style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 'clamp(2rem, 4vw, 3.2rem)',
          fontWeight: 800,
          letterSpacing: '-0.025em',
          marginBottom: '1.25rem',
          position: 'relative',
          zIndex: 1,
        }}>
          Ready to elevate your <span className="gradient-text">placement process?</span>
        </h2>
        <p style={{
          color: 'var(--color-text-secondary)',
          fontSize: '1.1rem',
          marginBottom: '2.5rem',
          position: 'relative', zIndex: 1,
        }}>
          Join the institutions running their career centers on JobPulse.
        </p>
        <Link
          to="/register"
          className="btn-primary"
          style={{ textDecoration: 'none', fontSize: '1.1rem', padding: '1rem 2.5rem', position: 'relative', zIndex: 1, display: 'inline-block' }}
        >
          Create Your Free Account →
        </Link>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid var(--color-border)',
        padding: '2.5rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <div style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 800,
          fontSize: '1.2rem',
          color: 'var(--color-text-secondary)',
        }}>
          Job<span className="gradient-text">Pulse</span>
        </div>
        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
          © {new Date().getFullYear()} JobPulse. The Intelligent Placement Platform.
        </div>
      </footer>
    </main>
  )
}

export default Home
