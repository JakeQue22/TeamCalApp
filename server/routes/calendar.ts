import { Router, Request, Response } from 'express';
import { calendarApi } from '../google';
import prisma from '../db';

export const calendarRouter = Router();

// Middleware to get user and tokens
const getUserTokens = async (req: Request, res: Response) => {
  const userId = req.session.userId;
  if (!userId) {
    res.status(401).json({ error: 'Not authenticated' });
    return null;
  }
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  
  if (!user || !user.accessToken) {
    res.status(401).json({ error: 'No access token' });
    return null;
  }
  
  return {
    ...user,
    accessToken: user.accessToken,
    refreshToken: user.refreshToken ?? undefined,
  };
};

// List all calendars
calendarRouter.get('/', async (req: Request, res: Response) => {
  try {
    const user = await getUserTokens(req, res);
    if (!user) return;
    
    const calendars = await calendarApi.listCalendars(
      user.accessToken,
      user.refreshToken
    );
    
    res.json(calendars);
  } catch (error) {
    console.error('List calendars error:', error);
    res.status(500).json({ error: 'Failed to fetch calendars' });
  }
});

// Get events from a specific calendar
calendarRouter.get('/:calendarId/events', async (req: Request, res: Response) => {
  try {
    const user = await getUserTokens(req, res);
    if (!user) return;
    
    const { calendarId } = req.params;
    const { timeMin, timeMax } = req.query;
    
    if (!timeMin || !timeMax) {
      return res.status(400).json({ error: 'timeMin and timeMax are required' });
    }
    
    const events = await calendarApi.getEvents(
      user.accessToken,
      calendarId as string,
      timeMin as string,
      timeMax as string,
      user.refreshToken
    );
    
    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get events from all calendars
calendarRouter.get('/events', async (req: Request, res: Response) => {
  try {
    const user = await getUserTokens(req, res);
    if (!user) return;
    
    const { timeMin, timeMax, calendars } = req.query;
    
    if (!timeMin || !timeMax) {
      return res.status(400).json({ error: 'timeMin and timeMax are required' });
    }
    
    // Get all calendars or filter by provided IDs
    let calendarList = await calendarApi.listCalendars(
      user.accessToken,
      user.refreshToken
    );
    
    if (calendars) {
      const calendarIds = (calendars as string).split(',');
      calendarList = calendarList.filter(c => calendarIds.includes(c.id || ''));
    }
    
    // Fetch events from all calendars
    const allEvents = await Promise.all(
      calendarList.map(async (calendar) => {
        if (!calendar.id) return [];
        
        try {
          const events = await calendarApi.getEvents(
            user.accessToken,
            calendar.id,
            timeMin as string,
            timeMax as string,
            user.refreshToken
          );
          
          return events.map(event => ({
            ...event,
            calendarId: calendar.id,
            calendarName: calendar.summary,
            calendarColor: calendar.backgroundColor,
          }));
        } catch (err) {
          console.error(`Error fetching events for calendar ${calendar.id}:`, err);
          return [];
        }
      })
    );
    
    // Flatten and sort events
    const flattenedEvents = allEvents
      .flat()
      .sort((a, b) => {
        const aStart = a.start?.dateTime ? new Date(a.start.dateTime).getTime() : 0;
        const bStart = b.start?.dateTime ? new Date(b.start.dateTime).getTime() : 0;
        return aStart - bStart;
      });
    
    res.json(flattenedEvents);
  } catch (error) {
    console.error('Get all events error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Create an event
calendarRouter.post('/:calendarId/events', async (req: Request, res: Response) => {
  try {
    const user = await getUserTokens(req, res);
    if (!user) return;
    
    const { calendarId } = req.params;
    const eventData = req.body;
    
    const newEvent = await calendarApi.createEvent(
      user.accessToken,
      calendarId,
      eventData,
      user.refreshToken
    );
    
    // Store event reference in our database
    if (newEvent.id) {
      await prisma.event.create({
        data: {
          googleEventId: newEvent.id,
          userId: user.id,
          calendarId,
          title: newEvent.summary || 'Untitled Event',
          description: newEvent.description || null,
          location: newEvent.location || null,
          startTime: new Date(newEvent.start?.dateTime || newEvent.start?.date || new Date()),
          endTime: new Date(newEvent.end?.dateTime || newEvent.end?.date || new Date()),
          allDay: !!newEvent.start?.date,
          colorId: newEvent.colorId || null,
          status: newEvent.status || 'confirmed',
        },
      });
    }
    
    res.json(newEvent);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update user preferences
calendarRouter.put('/preferences', async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const preferences = req.body;
    
    const updated = await prisma.userPreference.upsert({
      where: { userId },
      create: { userId, ...preferences },
      update: preferences,
    });
    
    res.json(updated);
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});
