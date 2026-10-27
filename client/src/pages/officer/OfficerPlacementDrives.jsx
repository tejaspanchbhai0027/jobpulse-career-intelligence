import React, { useState } from 'react';
import usePlacementDrives from '../../hooks/usePlacementDrives';
import CreateDriveModal from '../../components/modals/CreateDriveModal';

const OfficerPlacementDrives = () => {
  const { drives, loading, error, createDrive, updateDrive, updateDriveStatus, deleteDrive } = usePlacementDrives('OFFICER');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDrive, setEditingDrive] = useState(null);

  const handleOpenEdit = (drive) => {
    setEditingDrive(drive);
    setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingDrive(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this placement drive? This action cannot be undone.')) {
      const res = await deleteDrive(id);
      if (!res.success) {
        alert(res.message);
      }
    }
  };

  const handleStatusChange = async (id, status) => {
    const res = await updateDriveStatus(id, status);
    if (!res.success) {
      alert(res.message);
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>Placement Drives</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>View and manage campus recruitment events</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="btn-primary" 
          style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '999px', fontSize: '0.95rem' }}
        >
          <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>＋</span> Create Drive
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '16px', borderRadius: '12px', textAlign: 'center', fontWeight: 600, marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)' }}>Loading...</div>
      ) : drives.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <p style={{ color: 'var(--color-text-secondary)' }}>No placement drives available.</p>
        </div>
      ) : (
        <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'var(--color-bg)' }}>
              <tr>
                <th style={thStyle}>Title</th>
                <th style={thStyle}>Company</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Registered</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drives.map(drive => (
                <tr key={drive._id} style={{ borderTop: '1px solid var(--color-border)' }}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600 }}>{drive.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{new Date(drive.driveDate).toLocaleDateString()}</div>
                  </td>
                  <td style={tdStyle}>{drive.company}</td>
                  <td style={tdStyle}>
                    <select 
                      value={drive.status === 'REGISTRATION_OPEN' ? 'REGISTRATION_OPEN' : 'REGISTRATION_CLOSED'} 
                      onChange={(e) => handleStatusChange(drive._id, e.target.value)}
                      style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
                    >
                      <option value="REGISTRATION_OPEN">Open</option>
                      <option value="REGISTRATION_CLOSED">Close</option>
                    </select>
                  </td>
                  <td style={tdStyle}>{drive.registeredStudents?.length || 0}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleOpenEdit(drive)} style={{ padding: '6px 12px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Edit</button>
                      <button onClick={() => handleDelete(drive._id)} style={{ padding: '6px 12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <CreateDriveModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreate={createDrive} 
        onUpdate={updateDrive}
        initialData={editingDrive}
      />
    </div>
  );
};

const thStyle = {
  padding: '16px',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  fontSize: '0.9rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const tdStyle = {
  padding: '16px',
  color: 'var(--color-text-primary)'
};

export default OfficerPlacementDrives;
