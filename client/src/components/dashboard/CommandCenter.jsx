import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import CopilotWidget from './CopilotWidget';

const CommandCenter = ({ applications, interviews }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Timeframes
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  // Computations
  const actions = useMemo(() => {
    const urgent = [];
    const followUp = [];
    const opportunity = [];
    const experiment = []; // Mocking this for Phase A since experiments are just rolling out

    applications.forEach(app => {
      // 1. Follow Up
      if (app.needsFollowUp) {
        const daysSince = Math.floor((now - new Date(app.dateApplied)) / (1000 * 60 * 60 * 24));
        followUp.push({ 
          id: app._id, 
          company: app.company, 
          role: app.role,
          message: `${daysSince} days since application`,
          actionText: 'Follow up',
          type: 'follow-up'
        });
      }

      // 2. Urgent (Deadlines)
      if (app.closingDate) {
        const close = new Date(app.closingDate);
        if (close >= now && close <= threeDaysFromNow) {
          urgent.push({ 
            id: app._id, 
            company: app.company, 
            role: app.role,
            message: `Deadline closes in ${Math.ceil((close - now) / (1000 * 60 * 60 * 24))} days`,
            actionText: 'Apply before deadline',
            type: 'deadline'
          });
        }
      }

      // 3. Opportunity
      if (app.status === 'Wishlist' && app.isPriority) {
        opportunity.push({ 
          id: app._id, 
          company: app.company, 
          role: app.role,
          message: `High Priority Opportunity`,
          actionText: 'Review & Apply',
          type: 'opportunity'
        });
      }
    });

    interviews.forEach(iv => {
      const scheduled = new Date(iv.scheduledAt);
      if (scheduled >= now && scheduled <= threeDaysFromNow) {
        urgent.push({ 
          id: iv._id, 
          appId: iv.application?._id || iv.application,
          company: iv.application?.company || 'Company', 
          role: iv.interviewType,
          message: `Interview tomorrow`,
          actionText: 'Prepare',
          type: 'interview'
        });
      }
    });

    // Mocking an experiment action for UI purposes
    experiment.push({
      id: 'mock-exp-1',
      company: 'Referral vs Cold',
      message: '7 / 20 applications completed',
      actionText: 'Continue',
      type: 'experiment'
    });

    return { urgent, followUp, opportunity, experiment };
  }, [applications, interviews]);

  const ActionCard = ({ color, dotColor, badgeText, items, onActionClick }) => {
    if (items.length === 0) return null;
    return (
      <div style={{ marginBottom: '1.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-raised)' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: dotColor }}></div>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {badgeText}
          </span>
        </div>
        <div style={{ padding: '0.5rem 1.5rem' }}>
          {items.map((item, idx) => (
            <div key={item.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: idx !== items.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>{item.company}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>{item.message}</div>
              </div>
              <button 
                onClick={() => onActionClick(item)}
                style={{ 
                  background: 'transparent', 
                  border: '1px solid var(--color-border)', 
                  color: 'var(--color-text-primary)', 
                  padding: '0.5rem 1rem', 
                  borderRadius: '6px', 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'var(--transition)'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = dotColor; e.currentTarget.style.color = dotColor; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}
              >
                {item.actionText} <span>→</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleAction = (item) => {
    if (item.type === 'interview') {
      navigate(`/intelligence`); // Navigate to intelligence for interview prep
    } else if (item.type === 'experiment') {
      navigate('/intelligence');
    } else {
      // In a real scenario, this could open the specific application modal.
      console.log('Action triggered:', item);
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.5rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Today's Action Center
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>What you should do right now.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div>
          <ActionCard 
            dotColor="#ef4444" 
            badgeText="Urgent" 
            items={actions.urgent} 
            onActionClick={handleAction} 
          />

          <ActionCard 
            dotColor="#f59e0b" 
            badgeText="Follow Up" 
            items={actions.followUp} 
            onActionClick={handleAction} 
          />

          <ActionCard 
            dotColor="#10b981" 
            badgeText="Opportunity" 
            items={actions.opportunity} 
            onActionClick={handleAction} 
          />

          <ActionCard 
            dotColor="#3b82f6" 
            badgeText="Experiment" 
            items={actions.experiment} 
            onActionClick={handleAction} 
          />

          {actions.urgent.length === 0 && actions.followUp.length === 0 && actions.opportunity.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--color-surface)', borderRadius: '12px', border: '1px dashed var(--color-border)' }}>
              <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>You're all caught up!</h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>No urgent actions required today. Great time to source new opportunities.</p>
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <CopilotWidget />
          
          {/* Gamification 3.0 - Skill Progression */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
              {user?.jobSearchGoal?.toUpperCase() || 'ENGINEER'} PATH
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  <span>Node.js</span>
                  <span>90%</span>
                </div>
                <div style={{ height: '8px', background: 'var(--color-surface-overlay)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--color-brand)', width: '90%' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  <span>MongoDB</span>
                  <span>80%</span>
                </div>
                <div style={{ height: '8px', background: 'var(--color-surface-overlay)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#10b981', width: '80%' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  <span>System Design</span>
                  <span>60%</span>
                </div>
                <div style={{ height: '8px', background: 'var(--color-surface-overlay)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#f59e0b', width: '60%' }} />
                </div>
              </div>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  <span>Interview Readiness</span>
                  <span>70%</span>
                </div>
                <div style={{ height: '8px', background: 'var(--color-surface-overlay)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#8b5cf6', width: '70%' }} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', textAlign: 'right' }}>
                  +10% from last reflection
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default CommandCenter;
