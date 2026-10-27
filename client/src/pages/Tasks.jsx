import React, { useState } from 'react';
import useTasks from '../hooks/useTasks';
import TaskModal from '../components/modals/TaskModal';

const Tasks = () => {
  const { tasks, loading, error, createTask, updateTask, deleteTask } = useTasks();
  const [filter, setFilter] = useState('Pending'); // 'Pending', 'Completed', 'All'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [saving, setSaving] = useState(false);

  const filteredTasks = tasks.filter(t => {
    if (filter === 'All') return true;
    if (filter === 'Pending') return t.status !== 'Completed' && t.status !== 'Cancelled';
    if (filter === 'Completed') return t.status === 'Completed';
    return true;
  });

  const handleOpenModal = (task = null) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSave = async (taskData) => {
    setSaving(true);
    let res;
    if (editingTask) {
      res = await updateTask(editingTask._id, taskData);
    } else {
      res = await createTask(taskData);
    }
    setSaving(false);
    if (res.success) {
      setIsModalOpen(false);
    } else {
      alert(res.error);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTask(id);
    }
  };

  const handleToggleComplete = async (task, e) => {
    e.stopPropagation();
    const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    await updateTask(task._id, { status: newStatus });
  };

  return (
    <div className="page-container" style={{ minHeight: '100vh', background: 'var(--color-bg)', padding: '36px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', height: '100%', gap: '32px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.03em', lineHeight: 1.1, margin: 0 }}>Task Center</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', marginTop: '0.5rem', fontWeight: 500, margin: 0 }}>
              Manage your career follow-ups, assessments, and preparation.
            </p>
          </div>
          <button onClick={() => handleOpenModal()} className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', fontSize: '0.95rem', fontWeight: 700 }}>
            ➕ New Task
          </button>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['Pending', 'Completed', 'All'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '0.5rem 1rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'var(--transition)',
                background: filter === f ? 'var(--color-brand-primary)' : 'var(--color-surface)',
                color: filter === f ? '#fff' : 'var(--color-text-secondary)',
                boxShadow: filter === f ? 'var(--shadow-card)' : 'none',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', background: 'var(--color-surface)', borderRadius: '18px', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>No tasks found</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>{filter === 'Pending' ? "You're all caught up! No pending tasks." : "No tasks match this view."}</p>
            {filter === 'Pending' && <button onClick={() => handleOpenModal()} className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 700 }}>Create Task</button>}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {filteredTasks.map(task => (
              <div 
                key={task._id} 
                onClick={() => handleOpenModal(task)}
                style={{ 
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.5rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'var(--transition)', boxShadow: 'var(--shadow-card)',
                  opacity: task.status === 'Completed' || task.status === 'Cancelled' ? 0.6 : 1
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-brand-primary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                    <input 
                      type="checkbox" 
                      checked={task.status === 'Completed'} 
                      onChange={(e) => handleToggleComplete(task, e)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer', accentColor: 'var(--color-brand-primary)' }}
                    />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, textDecoration: task.status === 'Completed' ? 'line-through' : 'none' }}>
                      {task.title}
                    </h3>
                  </div>
                  <button onClick={(e) => handleDelete(task._id, e)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '0.25rem' }}>🗑</button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.6rem', background: 'var(--color-surface-overlay)', borderRadius: '6px', color: 'var(--color-text-secondary)' }}>
                    {task.type}
                  </span>
                  {task.priority === 'High' && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.6rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '6px' }}>
                      High Priority
                    </span>
                  )}
                  {task.dueDate && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.6rem', background: new Date(task.dueDate) < new Date() && task.status !== 'Completed' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: new Date(task.dueDate) < new Date() && task.status !== 'Completed' ? '#ef4444' : '#10b981', borderRadius: '6px' }}>
                      📅 {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                </div>

                {task.application && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-bg)', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
                    💼 <strong>{task.application.company}</strong> {task.application.role && `- ${task.application.role}`}
                  </div>
                )}
                
                {task.interview && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-bg)', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
                    🎙️ <strong>{task.interview.application?.company}</strong> - {task.interview.type}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} task={editingTask} onSave={handleSave} saving={saving} />
    </div>
  );
};

export default Tasks;
