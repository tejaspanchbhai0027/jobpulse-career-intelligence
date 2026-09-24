import React from 'react';
import usePlacementDrives from '../../hooks/usePlacementDrives';

const OfficerPlacementDrives = () => {
  const { drives, loading, error, updateDriveStatus } = usePlacementDrives('OFFICER');

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
                      value={drive.status} 
                      onChange={(e) => handleStatusChange(drive._id, e.target.value)}
                      style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
                    >
                      {['DRAFT', 'PUBLISHED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td style={tdStyle}>{drive.registeredStudents?.length || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
