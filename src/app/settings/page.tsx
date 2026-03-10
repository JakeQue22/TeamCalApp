'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  preferences?: {
    defaultView: string;
    timezone: string;
    weekStartsOn: number;
    workingHoursStart: string;
    workingHoursEnd: string;
    theme: string;
  };
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  members: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      name: string | null;
      email: string;
      picture: string | null;
    };
  }>;
}

export default function Settings() {
  const [user, setUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'general' | 'teams'>('general');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Preferences form
  const [defaultView, setDefaultView] = useState('week');
  const [timezone, setTimezone] = useState('UTC');
  const [weekStartsOn, setWeekStartsOn] = useState(0);
  const [workingHoursStart, setWorkingHoursStart] = useState('09:00');
  const [workingHoursEnd, setWorkingHoursEnd] = useState('17:00');
  const [theme, setTheme] = useState('light');

  // Team management
  const [addMemberEmail, setAddMemberEmail] = useState('');
  const [addMemberTeamId, setAddMemberTeamId] = useState('');
  const [addMemberError, setAddMemberError] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/auth/me');
      if (res.ok) {
        const data: User = await res.json();
        setUser(data);
        if (data.preferences) {
          setDefaultView(data.preferences.defaultView);
          setTimezone(data.preferences.timezone);
          setWeekStartsOn(data.preferences.weekStartsOn);
          setWorkingHoursStart(data.preferences.workingHoursStart);
          setWorkingHoursEnd(data.preferences.workingHoursEnd);
          setTheme(data.preferences.theme);
        }
        fetchTeams();
      } else {
        window.location.href = '/';
      }
    } catch {
      window.location.href = '/';
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/teams');
      if (res.ok) {
        const data: Team[] = await res.json();
        setTeams(data);
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/calendars/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultView,
          timezone,
          weekStartsOn,
          workingHoursStart,
          workingHoursEnd,
          theme,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddMember = async (teamId: string) => {
    setAddMemberError('');
    if (!addMemberEmail.trim()) {
      setAddMemberError('Email is required');
      return;
    }
    try {
      const res = await fetch(`/api/teams/${encodeURIComponent(teamId)}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: addMemberEmail.trim(), role: 'member' }),
      });
      if (res.ok) {
        setAddMemberEmail('');
        setAddMemberTeamId('');
        fetchTeams();
      } else {
        const data = await res.json();
        setAddMemberError(data.error || 'Failed to add member');
      }
    } catch {
      setAddMemberError('Failed to add member');
    }
  };

  const handleRemoveMember = async (teamId: string, memberId: string) => {
    if (!confirm('Remove this member from the team?')) return;
    try {
      await fetch(`/api/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(memberId)}`, {
        method: 'DELETE',
      });
      fetchTeams();
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team? This cannot be undone.')) return;
    try {
      await fetch(`/api/teams/${encodeURIComponent(teamId)}`, {
        method: 'DELETE',
      });
      fetchTeams();
    } catch (error) {
      console.error('Failed to delete team:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading...</p>
        <style jsx>{`
          .loading-screen {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            gap: 16px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <header className="settings-header">
        <div className="settings-header-left">
          <a href="/dashboard" className="back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
            Back to Dashboard
          </a>
          <h1>Settings</h1>
        </div>
        <div className="settings-header-right">
          <span className="user-name">{user?.name || user?.email}</span>
          <button className="btn btn-ghost" onClick={handleLogout}>Sign Out</button>
        </div>
      </header>

      <div className="settings-content">
        <nav className="settings-tabs">
          <button
            className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button
            className={`tab-button ${activeTab === 'teams' ? 'active' : ''}`}
            onClick={() => setActiveTab('teams')}
          >
            Teams
          </button>
        </nav>

        <div className="settings-body">
          {activeTab === 'general' && (
            <div className="settings-section">
              <h2>Preferences</h2>

              <div className="form-group">
                <label className="form-label">Default View</label>
                <select
                  className="form-input"
                  value={defaultView}
                  onChange={(e) => setDefaultView(e.target.value)}
                >
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                  <option value="schedule">Schedule</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Timezone</label>
                <select
                  className="form-input"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Berlin">Berlin</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                  <option value="Australia/Sydney">Sydney</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Week Starts On</label>
                <select
                  className="form-input"
                  value={weekStartsOn}
                  onChange={(e) => setWeekStartsOn(Number(e.target.value))}
                >
                  <option value={0}>Sunday</option>
                  <option value={1}>Monday</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Working Hours Start</label>
                  <input
                    type="time"
                    className="form-input"
                    value={workingHoursStart}
                    onChange={(e) => setWorkingHoursStart(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Working Hours End</label>
                  <input
                    type="time"
                    className="form-input"
                    value={workingHoursEnd}
                    onChange={(e) => setWorkingHoursEnd(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Theme</label>
                <select
                  className="form-input"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              <div className="form-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleSavePreferences}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Preferences'}
                </button>
                {saved && <span className="save-success">✓ Saved successfully</span>}
              </div>
            </div>
          )}

          {activeTab === 'teams' && (
            <div className="settings-section">
              <h2>Teams</h2>

              {teams.length === 0 ? (
                <div className="empty-state">
                  <p>No teams yet. Create a team from the dashboard sidebar.</p>
                </div>
              ) : (
                <div className="teams-list">
                  {teams.map(team => (
                    <div key={team.id} className="team-card">
                      <div className="team-card-header">
                        <div>
                          <h3>{team.name}</h3>
                          {team.description && <p className="team-description">{team.description}</p>}
                        </div>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleDeleteTeam(team.id)}
                          title="Delete team"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                          </svg>
                        </button>
                      </div>

                      <div className="members-list">
                        <h4>Members ({team.members.length})</h4>
                        {team.members.map(member => (
                          <div key={member.id} className="member-row">
                            <div className="member-avatar">
                              {member.user.name?.[0] || member.user.email[0].toUpperCase()}
                            </div>
                            <div className="member-details">
                              <span className="member-name">{member.user.name || member.user.email}</span>
                              <span className="member-role">{member.role}</span>
                            </div>
                            {member.role !== 'owner' && (
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleRemoveMember(team.id, member.id)}
                                title="Remove member"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="add-member-form">
                        {addMemberTeamId === team.id ? (
                          <div className="add-member-row">
                            <input
                              type="email"
                              className="form-input"
                              placeholder="Enter email address"
                              value={addMemberEmail}
                              onChange={(e) => setAddMemberEmail(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddMember(team.id);
                              }}
                            />
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleAddMember(team.id)}
                            >
                              Add
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => { setAddMemberTeamId(''); setAddMemberEmail(''); setAddMemberError(''); }}
                            >
                              Cancel
                            </button>
                            {addMemberError && <span className="error-text">{addMemberError}</span>}
                          </div>
                        ) : (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setAddMemberTeamId(team.id)}
                          >
                            + Add Member
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .settings-page {
          min-height: 100vh;
          background: var(--background);
        }

        .settings-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 32px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
        }

        .settings-header-left {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .back-link {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .back-link:hover {
          color: var(--primary);
        }

        .settings-header h1 {
          font-size: 1.5rem;
        }

        .settings-header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .user-name {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .settings-content {
          max-width: 800px;
          margin: 0 auto;
          padding: 32px;
        }

        .settings-tabs {
          display: flex;
          gap: 4px;
          background: var(--surface);
          border-radius: 8px;
          padding: 4px;
          margin-bottom: 24px;
          border: 1px solid var(--border);
        }

        .tab-button {
          padding: 10px 20px;
          border: none;
          background: transparent;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
          cursor: pointer;
          border-radius: 6px;
          transition: all 150ms;
        }

        .tab-button.active {
          background: var(--primary);
          color: white;
        }

        .tab-button:hover:not(.active) {
          color: var(--text-primary);
        }

        .settings-section {
          background: var(--surface);
          border-radius: 12px;
          padding: 32px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        .settings-section h2 {
          margin-bottom: 24px;
          font-size: 1.25rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-actions {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid var(--border);
        }

        .save-success {
          color: var(--success);
          font-size: 0.875rem;
          font-weight: 500;
        }

        .teams-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .team-card {
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 20px;
        }

        .team-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .team-card-header h3 {
          font-size: 1.125rem;
          margin-bottom: 4px;
        }

        .team-description {
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin: 0;
        }

        .members-list {
          margin-bottom: 16px;
        }

        .members-list h4 {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: 12px;
        }

        .member-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 0;
          border-bottom: 1px solid var(--border);
        }

        .member-row:last-child {
          border-bottom: none;
        }

        .member-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--primary-light);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
          flex-shrink: 0;
        }

        .member-details {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .member-name {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .member-role {
          font-size: 0.75rem;
          color: var(--text-secondary);
          background: var(--background);
          padding: 2px 8px;
          border-radius: 12px;
        }

        .add-member-form {
          padding-top: 12px;
        }

        .add-member-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .add-member-row .form-input {
          flex: 1;
          min-width: 200px;
        }

        .error-text {
          color: var(--danger);
          font-size: 0.75rem;
          width: 100%;
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 0.8125rem;
        }

        .empty-state {
          text-align: center;
          padding: 32px;
          color: var(--text-secondary);
        }

        .empty-state p {
          margin: 0;
        }

        @media (max-width: 768px) {
          .settings-content {
            padding: 16px;
          }

          .settings-header {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }

          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
