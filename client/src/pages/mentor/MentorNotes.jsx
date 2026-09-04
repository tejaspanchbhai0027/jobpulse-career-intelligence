import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const MentorNotes = () => {
  const [notes, setNotes] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [search, setSearch] = useState('');

  // Form State
  const [content, setContent] = useState('');
  const [actionItem, setActionItem] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [notesRes, studentsRes] = await Promise.all([
        api.get('/mentor/notes'),
        api.get('/mentor/students?limit=1000')
      ]);
      setNotes(notesRes.data.data || []);
      
      const st = studentsRes.data.data || [];
      setStudents(st);
      if (st.length > 0 && !selectedStudentId) {
        setSelectedStudentId(st[0]._id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    try {
      const payload = {
        studentId: selectedStudentId,
        content,
        actionItem,
        nextFollowUpDate: nextFollowUpDate || null
      };

      await api.post('/mentor/notes', payload);
      
      // Reset form
      setContent('');
      setActionItem('');
      setNextFollowUpDate('');
      
      fetchData(); // Refresh notes
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await api.delete(`/mentor/notes/${id}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete note');
    }
  };

  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  const selectedStudent = students.find(s => s._id === selectedStudentId);
  const studentNotes = notes.filter(n => n.studentId?._id === selectedStudentId).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  const openActionItems = studentNotes.filter(n => n.actionItem || n.nextFollowUpDate);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading workspace...</div>;
  if (error) return <div style={{ padding: '2rem', color: '#ef4444', textAlign: 'center' }}>{error}</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
          MENTORSHIP WORKSPACE
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', margin: '0.5rem 0 0 0' }}>
          Define goals, track progress, and log mentorship actions.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flex: 1, minHeight: 0 }}>
        {/* Left Pane - Student Selection */}
        <div style={{ width: '300px', display: 'flex', flexDirection: 'column', background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>
            <input 
              type="text" 
              placeholder="Search students..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
            />
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filteredStudents.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No students found.</div>
            ) : (
              filteredStudents.map(student => (
                <div 
                  key={student._id}
                  onClick={() => setSelectedStudentId(student._id)}
                  style={{ 
                    padding: '1rem', borderBottom: '1px solid var(--color-border)', cursor: 'pointer',
                    background: selectedStudentId === student._id ? 'var(--color-surface-overlay)' : 'transparent',
                    borderLeft: selectedStudentId === student._id ? '3px solid var(--color-brand-primary)' : '3px solid transparent'
                  }}
                >
                  <div style={{ fontWeight: 600, color: selectedStudentId === student._id ? 'var(--color-brand-primary)' : 'var(--color-text-primary)' }}>{student.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>{student.department || 'Student'}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Pane - Workspace */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', gap: '1.5rem' }}>
          {!selectedStudent ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', background: 'var(--color-surface)', borderRadius: '16px', border: '1px dashed var(--color-border)' }}>
              Select a student to view their workspace
            </div>
          ) : (
            <>
              {/* Snapshot */}
              <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}>{selectedStudent.name}</h2>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                    {selectedStudent.jobSearchGoal ? `Goal: ${selectedStudent.jobSearchGoal}` : 'Goal: Not set'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Stage</div>
                  <div style={{ fontWeight: 600, color: 'var(--color-brand-primary)' }}>
                    {selectedStudent.offerCount > 0 ? 'Placed' : selectedStudent.interviewCount > 0 ? 'Interviewing' : selectedStudent.applicationCount > 0 ? 'Applying' : 'Inactive'}
                  </div>
                </div>
              </div>

              {/* Two columns for middle content */}
              <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: 0 }}>
                
                {/* Past Notes & Actions */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                  <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-border)', fontWeight: 700 }}>
                    Past Notes
                  </div>
                  <div style={{ overflowY: 'auto', padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {studentNotes.length === 0 ? (
                      <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>No notes yet.</div>
                    ) : (
                      studentNotes.map(note => (
                        <div key={note._id} style={{ background: 'var(--color-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{new Date(note.createdAt).toLocaleString()}</div>
                            <button onClick={() => handleDelete(note._id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer' }}>Delete</button>
                          </div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', whiteSpace: 'pre-wrap' }}>{note.content}</div>
                          
                          {(note.actionItem || note.nextFollowUpDate) && (
                            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(59,130,246,0.05)', borderRadius: '6px', border: '1px solid rgba(59,130,246,0.1)' }}>
                              {note.actionItem && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-primary)' }}><strong style={{ color: '#3b82f6' }}>Action:</strong> {note.actionItem}</div>}
                              {note.nextFollowUpDate && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-primary)' }}><strong style={{ color: '#3b82f6' }}>Follow-up:</strong> {new Date(note.nextFollowUpDate).toLocaleDateString()}</div>}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Right side: Input & Action Items */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  {/* Action Items */}
                  {openActionItems.length > 0 && (
                    <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '1.25rem', maxHeight: '250px', overflowY: 'auto' }}>
                      <div style={{ fontWeight: 700, marginBottom: '1rem', color: '#f59e0b' }}>Open Action Items</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {openActionItems.map(note => (
                          <div key={`action-${note._id}`} style={{ padding: '0.75rem', background: 'var(--color-bg)', borderRadius: '8px', borderLeft: '3px solid #f59e0b' }}>
                            {note.actionItem && <div style={{ fontSize: '0.85rem' }}>{note.actionItem}</div>}
                            {note.nextFollowUpDate && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>Due: {new Date(note.nextFollowUpDate).toLocaleDateString()}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add Note Input */}
                  <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-border)', fontWeight: 700 }}>
                      Add Note / Action
                    </div>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem', flex: 1 }}>
                      <textarea 
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        placeholder="Type your notes here..."
                        style={{ flex: 1, width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)', resize: 'none', marginBottom: '1rem' }}
                        required
                      />
                      <input 
                        type="text"
                        value={actionItem}
                        onChange={e => setActionItem(e.target.value)}
                        placeholder="Action item (optional)"
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)', marginBottom: '1rem' }}
                      />
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <input 
                            type="date"
                            value={nextFollowUpDate}
                            onChange={e => setNextFollowUpDate(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
                          />
                        </div>
                        <button type="submit" disabled={saving} style={{ padding: '0.75rem 1.5rem', background: 'var(--color-brand-primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                          {saving ? 'Saving...' : 'Save Note'}
                        </button>
                      </div>
                    </form>
                  </div>

                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MentorNotes;
