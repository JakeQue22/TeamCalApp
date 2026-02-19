'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isSameDay,
  isToday,
  parseISO,
  addDays
} from 'date-fns';

interface User {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
}

interface Calendar {
  id: string;
  summary: string;
  backgroundColor?: string;
  foregroundColor?: string;
  primary?: boolean;
}

interface CalendarEvent {
  id?: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: {
    dateTime?: string;
    date?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
  };
  colorId?: string;
  calendarId?: string;
  calendarName?: string;
  calendarColor?: string;
  attendees?: Array<{ email: string; displayName?: string }>;
}

interface Team {
  id: string;
  name: string;
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

type ViewMode = 'day' | 'week' | 'month' | 'schedule';

interface EventFormData {
  title: string;
  description: string;
  location: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  allDay: boolean;
  calendarId: string;
  colorId: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [visibleCalendars, setVisibleCalendars] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showEventPanel, setShowEventPanel] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Event modal state
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventModalMode, setEventModalMode] = useState<'create' | 'edit'>('create');
  const [eventFormData, setEventFormData] = useState<EventFormData>({
    title: '', description: '', location: '',
    startDate: '', startTime: '', endDate: '', endTime: '',
    allDay: false, calendarId: '', colorId: '',
  });
  const [eventFormError, setEventFormError] = useState('');
  const [eventFormSubmitting, setEventFormSubmitting] = useState(false);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Create team state
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [teamFormData, setTeamFormData] = useState({ name: '', description: '' });
  const [teamFormError, setTeamFormError] = useState('');
  const [teamFormSubmitting, setTeamFormSubmitting] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchCalendars();
      fetchTeams();
    }
  }, [user]);

  const fetchEvents = useCallback(async () => {
    try {
      let timeMin: Date, timeMax: Date;
      
      if (viewMode === 'day') {
        timeMin = new Date(currentDate);
        timeMin.setHours(0, 0, 0, 0);
        timeMax = new Date(currentDate);
        timeMax.setHours(23, 59, 59, 999);
      } else if (viewMode === 'week') {
        timeMin = startOfWeek(currentDate, { weekStartsOn: 1 });
        timeMax = endOfWeek(currentDate, { weekStartsOn: 1 });
      } else if (viewMode === 'month') {
        // Fetch from start of first visible week to end of last visible week
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        timeMin = startOfWeek(monthStart, { weekStartsOn: 1 });
        timeMax = endOfWeek(monthEnd, { weekStartsOn: 1 });
      } else {
        // Schedule view - show 2 weeks
        timeMin = startOfWeek(currentDate, { weekStartsOn: 1 });
        timeMax = addDays(timeMin, 14);
      }

      const params = new URLSearchParams({
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        calendars: Array.from(visibleCalendars).join(','),
      });

      const res = await fetch(`/api/calendars/events?${params}`);
      if (res.ok) {
        const data: CalendarEvent[] = await res.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  }, [currentDate, viewMode, visibleCalendars]);

  useEffect(() => {
    if (user && calendars.length > 0) {
      fetchEvents();
    }
  }, [user, calendars.length, fetchEvents]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      window.location.href = '/';
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendars = async () => {
    try {
      const res = await fetch('/api/calendars');
      if (res.ok) {
        const data: Calendar[] = await res.json();
        setCalendars(data);
        // Show primary calendar by default
        const primaryId = data.find(c => c.primary)?.id || data[0]?.id;
        if (primaryId) {
          setVisibleCalendars(new Set([primaryId]));
        }
      }
    } catch (error) {
      console.error('Failed to fetch calendars:', error);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/teams');
      if (res.ok) {
        const data: Team[] = await res.json();
        setTeams(data);
        if (data.length > 0) {
          setSelectedTeam(data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error);
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

  const toggleCalendarVisibility = (calendarId: string) => {
    const newVisible = new Set(visibleCalendars);
    if (newVisible.has(calendarId)) {
      newVisible.delete(calendarId);
    } else {
      newVisible.add(calendarId);
    }
    setVisibleCalendars(newVisible);
  };

  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date());
    } else if (viewMode === 'day') {
      setCurrentDate(direction === 'next' ? addDays(currentDate, 1) : addDays(currentDate, -1));
    } else if (viewMode === 'week') {
      setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventPanel(true);
  };

  const getDateRange = () => {
    if (viewMode === 'day') {
      return format(currentDate, 'MMMM d, yyyy');
    } else if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    } else {
      return format(currentDate, 'MMMM yyyy');
    }
  };

  // --- Event Modal helpers ---

  const getDefaultCalendarId = useCallback(() => {
    const primary = calendars.find(c => c.primary);
    return primary?.id || calendars[0]?.id || '';
  }, [calendars]);

  const openCreateEventModal = useCallback((prefillDate?: Date, prefillHour?: number) => {
    const d = prefillDate || new Date();
    const hour = prefillHour ?? d.getHours();
    const startDate = format(d, 'yyyy-MM-dd');
    const startTime = `${String(hour).padStart(2, '0')}:00`;
    const endHour = Math.min(hour + 1, 23);
    const endTime = `${String(endHour).padStart(2, '0')}:00`;
    setEventFormData({
      title: '', description: '', location: '',
      startDate, startTime, endDate: startDate, endTime,
      allDay: false, calendarId: getDefaultCalendarId(), colorId: '',
    });
    setEventFormError('');
    setEventModalMode('create');
    setShowEventModal(true);
  }, [getDefaultCalendarId]);

  const openEditEventModal = useCallback(() => {
    if (!selectedEvent) return;
    const start = selectedEvent.start?.dateTime ? parseISO(selectedEvent.start.dateTime) : null;
    const end = selectedEvent.end?.dateTime ? parseISO(selectedEvent.end.dateTime) : null;
    const isAllDay = !selectedEvent.start?.dateTime && !!selectedEvent.start?.date;
    setEventFormData({
      title: selectedEvent.summary || '',
      description: selectedEvent.description || '',
      location: selectedEvent.location || '',
      startDate: start ? format(start, 'yyyy-MM-dd') : (selectedEvent.start?.date || ''),
      startTime: start ? format(start, 'HH:mm') : '09:00',
      endDate: end ? format(end, 'yyyy-MM-dd') : (selectedEvent.end?.date || ''),
      endTime: end ? format(end, 'HH:mm') : '10:00',
      allDay: isAllDay,
      calendarId: selectedEvent.calendarId || getDefaultCalendarId(),
      colorId: selectedEvent.colorId || '',
    });
    setEventFormError('');
    setEventModalMode('edit');
    setShowEventModal(true);
  }, [selectedEvent, getDefaultCalendarId]);

  const handleEventFormSubmit = useCallback(async () => {
    if (!eventFormData.title.trim()) {
      setEventFormError('Title is required');
      return;
    }
    if (!eventFormData.startDate) {
      setEventFormError('Start date is required');
      return;
    }
    if (eventModalMode === 'edit' && (!selectedEvent || !selectedEvent.id)) {
      setEventFormError('No event selected for editing');
      return;
    }
    setEventFormSubmitting(true);
    setEventFormError('');
    try {
      const endDateStr = eventFormData.endDate || eventFormData.startDate;
      if (eventModalMode === 'create') {
        let startTime: string;
        let endTime: string;
        if (eventFormData.allDay) {
          startTime = `${eventFormData.startDate}T00:00:00`;
          const nextDay = format(addDays(parseISO(endDateStr), 1), 'yyyy-MM-dd');
          endTime = `${nextDay}T00:00:00`;
        } else {
          startTime = `${eventFormData.startDate}T${eventFormData.startTime}:00`;
          endTime = `${endDateStr}T${eventFormData.endTime}:00`;
        }
        const res = await fetch('/api/events/quick-add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: eventFormData.title.trim(),
            startTime,
            endTime,
            allDay: eventFormData.allDay,
            calendarId: eventFormData.calendarId,
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to create event');
        }
      } else {
        // Edit mode
        let startTime: string;
        let endTime: string;
        if (eventFormData.allDay) {
          startTime = `${eventFormData.startDate}T00:00:00`;
          const nextDay = format(addDays(parseISO(endDateStr), 1), 'yyyy-MM-dd');
          endTime = `${nextDay}T00:00:00`;
        } else {
          startTime = `${eventFormData.startDate}T${eventFormData.startTime}:00`;
          endTime = `${endDateStr}T${eventFormData.endTime}:00`;
        }
        const res = await fetch(`/api/events/${encodeURIComponent(selectedEvent!.id!)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: eventFormData.title.trim(),
            description: eventFormData.description,
            location: eventFormData.location,
            startTime,
            endTime,
            allDay: eventFormData.allDay,
            calendarId: eventFormData.calendarId,
            colorId: eventFormData.colorId || undefined,
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to update event');
        }
      }
      setShowEventModal(false);
      setShowEventPanel(false);
      setSelectedEvent(null);
      await fetchEvents();
    } catch (error: unknown) {
      setEventFormError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setEventFormSubmitting(false);
    }
  }, [eventFormData, eventModalMode, selectedEvent, fetchEvents]);

  // --- Delete handler ---

  const handleDeleteEvent = useCallback(async () => {
    if (!selectedEvent?.id) return;
    setDeleteSubmitting(true);
    try {
      const params = new URLSearchParams();
      if (selectedEvent.calendarId) {
        params.set('calendarId', selectedEvent.calendarId);
      }
      const res = await fetch(`/api/events/${encodeURIComponent(selectedEvent.id)}?${params}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to delete event');
      }
      setShowDeleteConfirm(false);
      setShowEventPanel(false);
      setSelectedEvent(null);
      await fetchEvents();
    } catch (error) {
      console.error('Delete failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete event');
    } finally {
      setDeleteSubmitting(false);
    }
  }, [selectedEvent, fetchEvents]);

  // --- Create Team handler ---

  const handleCreateTeam = useCallback(async () => {
    if (!teamFormData.name.trim()) {
      setTeamFormError('Team name is required');
      return;
    }
    setTeamFormSubmitting(true);
    setTeamFormError('');
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: teamFormData.name.trim(),
          description: teamFormData.description.trim(),
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create team');
      }
      setShowCreateTeam(false);
      setTeamFormData({ name: '', description: '' });
      await fetchTeams();
    } catch (error: unknown) {
      setTeamFormError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setTeamFormSubmitting(false);
    }
  }, [teamFormData]);

  // --- View renderers ---

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="week-view">
        <div className="week-header">
          <div className="time-gutter"></div>
          <div className={`day-column-header ${isToday(currentDate) ? 'today' : ''}`}>
            <span className="day-name">{format(currentDate, 'EEEE')}</span>
            <span className="day-number">{format(currentDate, 'd')}</span>
          </div>
        </div>
        <div className="week-body">
          <div className="time-gutter">
            {hours.map(hour => (
              <div key={hour} className="time-slot">
                {format(new Date(2000, 0, 1, hour, 0), 'h a')}
              </div>
            ))}
          </div>
          <div className="day-column">
            {hours.map(hour => (
              <div key={hour} className="hour-cell" onClick={() => openCreateEventModal(currentDate, hour)}>
                {events
                  .filter(e => {
                    const eventStart = e.start?.dateTime ? parseISO(e.start.dateTime) : null;
                    return eventStart && isSameDay(eventStart, currentDate) && eventStart.getHours() === hour;
                  })
                  .map(event => (
                    <div
                      key={event.id}
                      className="event-block"
                      style={{ backgroundColor: event.calendarColor || '#3F51B5' }}
                      onClick={(e) => { e.stopPropagation(); handleEventClick(event); }}
                    >
                      {event.summary}
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="week-view">
        <div className="week-header">
          <div className="time-gutter"></div>
          {days.map(day => (
            <div key={day.toISOString()} className={`day-column-header ${isToday(day) ? 'today' : ''}`}>
              <span className="day-name">{format(day, 'EEE')}</span>
              <span className="day-number">{format(day, 'd')}</span>
            </div>
          ))}
        </div>
        <div className="week-body">
          <div className="time-gutter">
            {hours.map(hour => (
              <div key={hour} className="time-slot">
                {format(new Date(2000, 0, 1, hour, 0), 'h a')}
              </div>
            ))}
          </div>
          {days.map(day => (
            <div key={day.toISOString()} className="day-column">
              {hours.map(hour => (
                <div key={hour} className="hour-cell" onClick={() => openCreateEventModal(day, hour)}>
                  {events
                    .filter(e => {
                      const eventStart = e.start?.dateTime ? parseISO(e.start.dateTime) : null;
                      return eventStart && isSameDay(eventStart, day) && eventStart.getHours() === hour;
                    })
                    .map(event => (
                      <div
                        key={event.id}
                        className="event-block"
                        style={{ backgroundColor: event.calendarColor || '#3F51B5' }}
                        onClick={(e) => { e.stopPropagation(); handleEventClick(event); }}
                      >
                        {event.summary}
                      </div>
                    ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
      <div className="month-view">
        <div className="month-header">
          {weekDays.map(d => (
            <div key={d} className="month-weekday">{d}</div>
          ))}
        </div>
        <div className="month-grid">
          {days.map(day => {
            const dayEvents = events.filter(e => {
              const eventStart = e.start?.dateTime
                ? parseISO(e.start.dateTime)
                : e.start?.date ? parseISO(e.start.date) : null;
              return eventStart && isSameDay(eventStart, day);
            });
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            return (
              <div
                key={day.toISOString()}
                className={`month-cell ${!isCurrentMonth ? 'other-month' : ''} ${isToday(day) ? 'today' : ''}`}
                onClick={() => { setCurrentDate(day); setViewMode('day'); }}
              >
                <span className={`month-day-number ${isToday(day) ? 'today-badge' : ''}`}>
                  {format(day, 'd')}
                </span>
                <div className="month-events">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className="month-event"
                      style={{ backgroundColor: event.calendarColor || '#3F51B5' }}
                      onClick={(e) => { e.stopPropagation(); handleEventClick(event); }}
                    >
                      {event.summary}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="month-more">+{dayEvents.length - 3} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderScheduleView = () => {
    // Schedule view: Horizontal timeline with team members as columns
    const days = eachDayOfInterval({
      start: startOfWeek(currentDate, { weekStartsOn: 1 }),
      end: addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), 6)
    });

    // Get team members or use a default list
    const members = selectedTeam?.members.map(m => m.user) || [
      { id: '1', name: 'Team Member 1', email: 'member1@example.com' },
      { id: '2', name: 'Team Member 2', email: 'member2@example.com' },
    ];

    return (
      <div className="schedule-view">
        <div className="schedule-header">
          <div className="member-column-header">Team</div>
          {days.map(day => (
            <div key={day.toISOString()} className={`schedule-day-header ${isToday(day) ? 'today' : ''}`}>
              <span className="day-name">{format(day, 'EEE')}</span>
              <span className="day-number">{format(day, 'd')}</span>
            </div>
          ))}
        </div>
        <div className="schedule-body">
          {members.map(member => (
            <div key={member.id} className="schedule-row">
              <div className="member-cell">
                <div className="member-avatar">
                  {member.name?.[0] || member.email[0].toUpperCase()}
                </div>
                <div className="member-info">
                  <span className="member-name">{member.name || member.email.split('@')[0]}</span>
                </div>
              </div>
              {days.map(day => (
                <div key={day.toISOString()} className="schedule-cell">
                  {events
                    .filter(e => {
                      const eventStart = e.start?.dateTime ? parseISO(e.start.dateTime) : null;
                      return eventStart && isSameDay(eventStart, day);
                    })
                    .map(event => {
                      const start = event.start?.dateTime ? parseISO(event.start.dateTime) : null;
                      const end = event.end?.dateTime ? parseISO(event.end.dateTime) : null;
                      if (!start || !end) return null;
                      
                      const startHour = start.getHours() + start.getMinutes() / 60;
                      const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                      
                      return (
                        <div
                          key={event.id}
                          className="schedule-event"
                          style={{
                            top: `${(startHour - 8) * 60}px`,
                            height: `${duration * 60}px`,
                            backgroundColor: event.calendarColor || '#3F51B5',
                          }}
                          onClick={() => handleEventClick(event)}
                        >
                          <span className="event-title">{event.summary}</span>
                          <span className="event-time">
                            {format(start, 'h:mm a')} - {format(end, 'h:mm a')}
                          </span>
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCalendarView = () => {
    switch (viewMode) {
      case 'day': return renderDayView();
      case 'week': return renderWeekView();
      case 'month': return renderMonthView();
      case 'schedule': return renderScheduleView();
      default: return renderWeekView();
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <svg width="24" height="24" viewBox="0 0 150 150" fill="none">
              <rect width="150" height="150" rx="20" fill="var(--primary)"/>
              <path d="M45 45h60v60H45V45z" fill="none" stroke="white" strokeWidth="4"/>
              <path d="M45 75h60M75 45v60" stroke="white" strokeWidth="4" strokeLinecap="round"/>
            </svg>
            {sidebarOpen && <span>TeamCal</span>}
          </div>
          <button className="btn btn-ghost btn-icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              {sidebarOpen ? (
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              ) : (
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              )}
            </svg>
          </button>
        </div>

        {sidebarOpen && (
          <>
            <div className="sidebar-section">
              <label className="sidebar-label">Team</label>
              <select 
                className="form-input"
                value={selectedTeam?.id || ''}
                onChange={(e) => {
                  const team = teams.find(t => t.id === e.target.value);
                  setSelectedTeam(team || null);
                }}
              >
                <option value="">My Calendar</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
              <button
                className="btn btn-secondary create-team-btn"
                onClick={() => { setShowCreateTeam(true); setTeamFormData({ name: '', description: '' }); setTeamFormError(''); }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                Create Team
              </button>
              {showCreateTeam && (
                <div className="create-team-form">
                  <div className="form-group">
                    <label className="form-label">Team Name</label>
                    <input
                      className="form-input"
                      type="text"
                      value={teamFormData.name}
                      placeholder="My Team"
                      onChange={e => setTeamFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <input
                      className="form-input"
                      type="text"
                      value={teamFormData.description}
                      placeholder="Optional description"
                      onChange={e => setTeamFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  {teamFormError && <div className="form-error">{teamFormError}</div>}
                  <div className="create-team-actions">
                    <button className="btn btn-primary" onClick={handleCreateTeam} disabled={teamFormSubmitting}>
                      {teamFormSubmitting ? 'Creating...' : 'Create'}
                    </button>
                    <button className="btn btn-ghost" onClick={() => setShowCreateTeam(false)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>

            <div className="sidebar-section">
              <label className="sidebar-label">Calendars</label>
              <div className="calendar-list">
                {calendars.map(calendar => (
                  <label key={calendar.id} className="calendar-toggle">
                    <input
                      type="checkbox"
                      checked={visibleCalendars.has(calendar.id)}
                      onChange={() => toggleCalendarVisibility(calendar.id)}
                    />
                    <span 
                      className="calendar-color" 
                      style={{ backgroundColor: calendar.backgroundColor || '#3F51B5' }}
                    />
                    <span className="calendar-name">{calendar.summary}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Bar */}
        <header className="top-bar">
          <div className="top-bar-left">
            <div className="date-navigation">
              <button className="btn btn-ghost btn-icon" onClick={() => navigateDate('prev')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                </svg>
              </button>
              <button className="btn btn-secondary" onClick={() => navigateDate('today')}>
                Today
              </button>
              <button className="btn btn-ghost btn-icon" onClick={() => navigateDate('next')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
                </svg>
              </button>
            </div>
            <h2 className="current-date">{getDateRange()}</h2>
          </div>

          <div className="top-bar-center">
            <div className="view-toggle">
              {(['day', 'week', 'month', 'schedule'] as ViewMode[]).map(mode => (
                <button
                  key={mode}
                  className={`view-button ${viewMode === mode ? 'active' : ''}`}
                  onClick={() => setViewMode(mode)}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="top-bar-right">
            <button className="btn btn-primary" onClick={() => openCreateEventModal()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              Create Event
            </button>
            <div className="user-menu">
              <button className="user-button">
                {user?.picture ? (
                  <img src={user.picture} alt={user.name || 'User'} className="avatar" />
                ) : (
                  <div className="avatar-placeholder">
                    {user?.name?.[0] || user?.email[0].toUpperCase()}
                  </div>
                )}
              </button>
              <div className="user-dropdown">
                <div className="user-info">
                  <span className="user-name">{user?.name || 'User'}</span>
                  <span className="user-email">{user?.email}</span>
                </div>
                <div className="dropdown-divider" />
                <button className="dropdown-item" onClick={() => window.location.href = '/settings'}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                  </svg>
                  Settings
                </button>
                <button className="dropdown-item" onClick={handleLogout}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Calendar View */}
        <div className="calendar-container">
          {renderCalendarView()}
        </div>
      </main>

      {/* Event Detail Panel */}
      {showEventPanel && selectedEvent && (
        <div className="event-panel">
          <div className="event-panel-header">
            <h3>{selectedEvent.summary || 'Untitled Event'}</h3>
            <button className="btn btn-ghost btn-icon" onClick={() => setShowEventPanel(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
          <div className="event-panel-body">
            <div className="event-detail">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
              </svg>
              <span>
                {selectedEvent.start?.dateTime 
                  ? format(parseISO(selectedEvent.start.dateTime), 'EEEE, MMMM d, yyyy h:mm a')
                  : selectedEvent.start?.date
                }
                {' - '}
                {selectedEvent.end?.dateTime 
                  ? format(parseISO(selectedEvent.end.dateTime), 'h:mm a')
                  : selectedEvent.end?.date
                }
              </span>
            </div>
            {selectedEvent.location && (
              <div className="event-detail">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <span>{selectedEvent.location}</span>
              </div>
            )}
            {selectedEvent.description && (
              <div className="event-detail">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                </svg>
                <span>{selectedEvent.description}</span>
              </div>
            )}
            <div className="event-detail">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
              </svg>
              <span>{selectedEvent.calendarName || 'Calendar'}</span>
            </div>
          </div>
          <div className="event-panel-actions">
            <button className="btn btn-secondary" onClick={openEditEventModal}>Edit</button>
            <button className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)}>Delete</button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedEvent && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content modal-small" onClick={e => e.stopPropagation()}>
            <h3>Delete Event</h3>
            <p className="delete-confirm-text">
              Are you sure you want to delete &quot;{selectedEvent.summary || 'Untitled Event'}&quot;? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowDeleteConfirm(false)} disabled={deleteSubmitting}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDeleteEvent} disabled={deleteSubmitting}>
                {deleteSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Create/Edit Modal */}
      {showEventModal && (
        <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{eventModalMode === 'create' ? 'Create Event' : 'Edit Event'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowEventModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  className="form-input"
                  type="text"
                  value={eventFormData.title}
                  placeholder="Event title"
                  onChange={e => setEventFormData(prev => ({ ...prev, title: e.target.value }))}
                  autoFocus
                />
              </div>
              <div className="form-row">
                <div className="form-group form-group-flex">
                  <label className="form-label">Start Date</label>
                  <input
                    className="form-input"
                    type="date"
                    value={eventFormData.startDate}
                    onChange={e => setEventFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                {!eventFormData.allDay && (
                  <div className="form-group form-group-flex">
                    <label className="form-label">Start Time</label>
                    <input
                      className="form-input"
                      type="time"
                      value={eventFormData.startTime}
                      onChange={e => setEventFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                )}
              </div>
              <div className="form-row">
                <div className="form-group form-group-flex">
                  <label className="form-label">End Date</label>
                  <input
                    className="form-input"
                    type="date"
                    value={eventFormData.endDate}
                    onChange={e => setEventFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
                {!eventFormData.allDay && (
                  <div className="form-group form-group-flex">
                    <label className="form-label">End Time</label>
                    <input
                      className="form-input"
                      type="time"
                      value={eventFormData.endTime}
                      onChange={e => setEventFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={eventFormData.allDay}
                    onChange={e => setEventFormData(prev => ({ ...prev, allDay: e.target.checked }))}
                  />
                  All day
                </label>
              </div>
              {eventModalMode === 'edit' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-input form-textarea"
                      value={eventFormData.description}
                      placeholder="Add description"
                      rows={3}
                      onChange={e => setEventFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input
                      className="form-input"
                      type="text"
                      value={eventFormData.location}
                      placeholder="Add location"
                      onChange={e => setEventFormData(prev => ({ ...prev, location: e.target.value }))}
                    />
                  </div>
                </>
              )}
              <div className="form-group">
                <label className="form-label">Calendar</label>
                <select
                  className="form-input"
                  value={eventFormData.calendarId}
                  onChange={e => setEventFormData(prev => ({ ...prev, calendarId: e.target.value }))}
                >
                  {calendars.map(cal => (
                    <option key={cal.id} value={cal.id}>{cal.summary}</option>
                  ))}
                </select>
              </div>
              {eventFormError && <div className="form-error">{eventFormError}</div>}
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowEventModal(false)} disabled={eventFormSubmitting}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleEventFormSubmit} disabled={eventFormSubmitting}>
                {eventFormSubmitting
                  ? (eventModalMode === 'create' ? 'Creating...' : 'Saving...')
                  : (eventModalMode === 'create' ? 'Create Event' : 'Save Changes')
                }
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .dashboard {
          display: flex;
          min-height: 100vh;
          background: var(--background);
        }

        .loading-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          gap: 16px;
        }

        /* Sidebar */
        .sidebar {
          width: 280px;
          background: var(--surface);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          transition: width var(--transition-default);
        }

        .sidebar.collapsed {
          width: 64px;
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-bottom: 1px solid var(--border);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: var(--font-heading);
          font-weight: 700;
          color: var(--primary);
        }

        .sidebar-section {
          padding: 16px;
          border-bottom: 1px solid var(--border);
        }

        .sidebar-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .calendar-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .calendar-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          padding: 4px 0;
        }

        .calendar-toggle input {
          accent-color: var(--primary);
        }

        .calendar-color {
          width: 12px;
          height: 12px;
          border-radius: 3px;
        }

        .calendar-name {
          font-size: 0.875rem;
          color: var(--text-primary);
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .create-team-btn {
          margin-top: 10px;
          width: 100%;
          font-size: 0.8125rem;
        }

        .create-team-form {
          margin-top: 12px;
          padding: 12px;
          background: var(--background);
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
        }

        .create-team-actions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }

        /* Main Content */
        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 24px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          gap: 24px;
        }

        .top-bar-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .date-navigation {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .current-date {
          font-size: 1.25rem;
          font-weight: 600;
        }

        .top-bar-center {
          flex: 1;
          display: flex;
          justify-content: center;
        }

        .view-toggle {
          display: flex;
          background: var(--background);
          border-radius: 8px;
          padding: 4px;
        }

        .view-button {
          padding: 8px 16px;
          font-size: 0.875rem;
          font-weight: 500;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          border-radius: 6px;
          transition: all var(--transition-fast);
        }

        .view-button.active {
          background: var(--surface);
          color: var(--primary);
          box-shadow: var(--shadow-card);
        }

        .view-button:hover:not(.active) {
          color: var(--text-primary);
        }

        .top-bar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .user-menu {
          position: relative;
        }

        .user-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
        }

        .avatar-placeholder {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
        }

        .user-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 8px;
          min-width: 200px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          box-shadow: var(--shadow-elevated);
          opacity: 0;
          visibility: hidden;
          transform: translateY(-8px);
          transition: all var(--transition-fast);
          z-index: 100;
        }

        .user-menu:hover .user-dropdown {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .user-info {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
        }

        .user-name {
          display: block;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .user-email {
          display: block;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        /* Calendar Container */
        .calendar-container {
          flex: 1;
          overflow: auto;
          padding: 24px;
        }

        /* Week View */
        .week-view {
          background: var(--surface);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: var(--shadow-card);
        }

        .week-header {
          display: flex;
          border-bottom: 1px solid var(--border);
        }

        .time-gutter {
          width: 60px;
          flex-shrink: 0;
        }

        .day-column-header {
          flex: 1;
          padding: 12px;
          text-align: center;
          border-left: 1px solid var(--border);
        }

        .day-column-header.today {
          background: rgba(63, 81, 181, 0.1);
        }

        .day-name {
          display: block;
          font-size: 0.75rem;
          color: var(--text-secondary);
          text-transform: uppercase;
        }

        .day-number {
          display: block;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .day-column-header.today .day-number {
          color: var(--primary);
        }

        .week-body {
          display: flex;
          max-height: calc(100vh - 250px);
          overflow-y: auto;
        }

        .time-slot {
          height: 48px;
          padding: 4px 8px;
          font-size: 0.75rem;
          color: var(--text-secondary);
          text-align: right;
          font-family: var(--font-mono);
        }

        .day-column {
          flex: 1;
          border-left: 1px solid var(--border);
        }

        .hour-cell {
          height: 48px;
          border-bottom: 1px solid var(--border);
          position: relative;
          cursor: pointer;
        }

        .hour-cell:hover {
          background: var(--background);
        }

        .event-block {
          position: absolute;
          left: 2px;
          right: 2px;
          padding: 4px 6px;
          border-radius: 4px;
          font-size: 0.75rem;
          color: white;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          cursor: pointer;
          z-index: 1;
        }

        /* Month View */
        .month-view {
          background: var(--surface);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: var(--shadow-card);
        }

        .month-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          border-bottom: 1px solid var(--border);
        }

        .month-weekday {
          padding: 12px;
          text-align: center;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
        }

        .month-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
        }

        .month-cell {
          min-height: 100px;
          border-right: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          padding: 6px;
          cursor: pointer;
          transition: background var(--transition-fast);
        }

        .month-cell:nth-child(7n) {
          border-right: none;
        }

        .month-cell:hover {
          background: var(--background);
        }

        .month-cell.other-month {
          opacity: 0.4;
        }

        .month-cell.today {
          background: rgba(63, 81, 181, 0.05);
        }

        .month-day-number {
          display: inline-block;
          font-size: 0.8125rem;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .today-badge {
          background: var(--primary);
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .month-events {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .month-event {
          padding: 2px 4px;
          border-radius: 3px;
          font-size: 0.6875rem;
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          cursor: pointer;
        }

        .month-event:hover {
          opacity: 0.85;
        }

        .month-more {
          font-size: 0.6875rem;
          color: var(--text-secondary);
          padding: 1px 4px;
        }

        /* Schedule View */
        .schedule-view {
          background: var(--surface);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: var(--shadow-card);
        }

        .schedule-header {
          display: flex;
          border-bottom: 1px solid var(--border);
        }

        .member-column-header {
          width: 150px;
          padding: 16px;
          font-weight: 600;
          font-size: 0.875rem;
          border-right: 1px solid var(--border);
        }

        .schedule-day-header {
          flex: 1;
          padding: 12px;
          text-align: center;
          border-left: 1px solid var(--border);
        }

        .schedule-day-header.today {
          background: rgba(63, 81, 181, 0.1);
        }

        .schedule-body {
          max-height: calc(100vh - 250px);
          overflow-y: auto;
        }

        .schedule-row {
          display: flex;
          border-bottom: 1px solid var(--border);
        }

        .member-cell {
          width: 150px;
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-right: 1px solid var(--border);
        }

        .member-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--primary-light);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .member-info {
          flex: 1;
        }

        .member-name {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .schedule-cell {
          flex: 1;
          height: 120px;
          border-left: 1px solid var(--border);
          position: relative;
        }

        .schedule-event {
          position: absolute;
          left: 4px;
          right: 4px;
          border-radius: 4px;
          padding: 4px 8px;
          color: white;
          font-size: 0.75rem;
          overflow: hidden;
          cursor: pointer;
          transition: transform var(--transition-fast);
        }

        .schedule-event:hover {
          transform: scale(1.02);
          z-index: 10;
        }

        .event-title {
          display: block;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .event-time {
          display: block;
          opacity: 0.8;
          font-size: 0.6875rem;
        }

        /* Event Panel */
        .event-panel {
          position: fixed;
          top: 0;
          right: 0;
          width: 400px;
          height: 100vh;
          background: var(--surface);
          box-shadow: var(--shadow-modal);
          z-index: 1000;
          animation: slideIn 0.2s ease-out;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .event-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
        }

        .event-panel-header h3 {
          font-size: 1.125rem;
        }

        .event-panel-body {
          padding: 24px;
        }

        .event-detail {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 16px;
          color: var(--text-secondary);
        }

        .event-detail svg {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .event-panel-actions {
          display: flex;
          gap: 12px;
          padding: 24px;
          border-top: 1px solid var(--border);
        }

        .btn-danger {
          background: var(--danger);
          color: white;
        }

        .btn-danger:hover {
          background: #d32f2f;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          animation: fadeIn 0.15s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: var(--surface);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-modal);
          width: 480px;
          max-width: 90vw;
          max-height: 90vh;
          overflow-y: auto;
          animation: modalSlideUp 0.2s ease-out;
        }

        .modal-small {
          width: 380px;
          padding: 24px;
        }

        @keyframes modalSlideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px 0;
        }

        .modal-header h3 {
          font-size: 1.125rem;
        }

        .modal-body {
          padding: 20px 24px;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid var(--border);
        }

        .form-row {
          display: flex;
          gap: 12px;
        }

        .form-group-flex {
          flex: 1;
        }

        .form-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 0.875rem;
          color: var(--text-primary);
        }

        .form-checkbox input {
          accent-color: var(--primary);
        }

        .form-textarea {
          resize: vertical;
          min-height: 60px;
          font-family: var(--font-primary);
        }

        .form-error {
          color: var(--danger);
          font-size: 0.8125rem;
          margin-top: 4px;
        }

        .delete-confirm-text {
          margin: 16px 0;
          color: var(--text-secondary);
          font-size: 0.9rem;
          line-height: 1.5;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .sidebar {
            position: fixed;
            left: 0;
            top: 0;
            bottom: 0;
            z-index: 1000;
            transform: translateX(-100%);
          }

          .sidebar.open {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
