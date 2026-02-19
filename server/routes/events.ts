import { Router, Request, Response } from 'express';
import { calendarApi } from '../google';
import prisma from '../db';

export const eventRouter = Router();

// Get user's events from local database
eventRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }
    
    const events = await prisma.event.findMany({
      where: {
        userId,
        startTime: {
          gte: new Date(startDate as string),
        },
        endTime: {
          lte: new Date(endDate as string),
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });
    
    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Update an event (both local and Google)
eventRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { id } = req.params;
    const { title, description, location, startTime, endTime, allDay, colorId, calendarId } = req.body;
    
    // Get the local event
    const localEvent = await prisma.event.findFirst({
      where: {
        id,
        userId,
      },
    });
    
    if (!localEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Get user tokens
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user || !user.accessToken) {
      return res.status(401).json({ error: 'No access token' });
    }
    
    // Update in Google Calendar if we have a Google event ID
    if (localEvent.googleEventId && calendarId) {
      const googleEvent = await calendarApi.updateEvent(
        user.accessToken,
        calendarId,
        localEvent.googleEventId,
        {
          summary: title,
          description,
          location,
          start: allDay 
            ? { date: startTime.split('T')[0] }
            : { dateTime: startTime },
          end: allDay 
            ? { date: endTime.split('T')[0] }
            : { dateTime: endTime },
          colorId,
        },
        user.refreshToken || undefined
      );
    }
    
    // Update local record
    const updated = await prisma.event.update({
      where: { id },
      data: {
        title: title || undefined,
        description: description !== undefined ? description : undefined,
        location: location !== undefined ? location : undefined,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        allDay: allDay !== undefined ? allDay : undefined,
        colorId: colorId !== undefined ? colorId : undefined,
      },
    });
    
    res.json(updated);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete an event
eventRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { id } = req.params;
    const { calendarId } = req.query;
    
    // Get the local event
    const localEvent = await prisma.event.findFirst({
      where: {
        id,
        userId,
      },
    });
    
    if (!localEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Get user tokens
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user || !user.accessToken) {
      return res.status(401).json({ error: 'No access token' });
    }
    
    // Delete from Google Calendar if we have a Google event ID
    if (localEvent.googleEventId && calendarId) {
      await calendarApi.deleteEvent(
        user.accessToken,
        calendarId as string,
        localEvent.googleEventId,
        user.refreshToken || undefined
      );
    }
    
    // Delete local record
    await prisma.event.delete({
      where: { id },
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Quick add event (create event with minimal info)
eventRouter.post('/quick-add', async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { title, startTime, endTime, allDay, calendarId } = req.body;
    
    if (!title || !startTime || !endTime || !calendarId) {
      return res.status(400).json({ error: 'Title, startTime, endTime, and calendarId are required' });
    }
    
    // Get user tokens
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user || !user.accessToken) {
      return res.status(401).json({ error: 'No access token' });
    }
    
    // Create in Google Calendar
    const googleEvent = await calendarApi.createEvent(
      user.accessToken,
      calendarId,
      {
        summary: title,
        start: allDay 
          ? { date: startTime.split('T')[0] }
          : { dateTime: startTime },
        end: allDay 
          ? { date: endTime.split('T')[0] }
          : { dateTime: endTime },
      },
      user.refreshToken || undefined
    );
    
    // Store in local database
    const localEvent = await prisma.event.create({
      data: {
        googleEventId: googleEvent.id,
        userId,
        calendarId,
        title,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        allDay: allDay || false,
        status: 'confirmed',
      },
    });
    
    res.json({
      ...localEvent,
      googleEvent,
    });
  } catch (error) {
    console.error('Quick add event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});
