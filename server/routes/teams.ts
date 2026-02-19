import { Router, Request, Response } from 'express';
import prisma from '../db';

export const teamRouter = Router();

// Get all teams for current user
teamRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                picture: true,
              },
            },
          },
        },
        calendars: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    res.json(teams);
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Create a new team
teamRouter.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Team name is required' });
    }
    
    // Create team with current user as owner
    const team = await prisma.team.create({
      data: {
        name,
        description: description || null,
        members: {
          create: {
            userId,
            role: 'owner',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                picture: true,
              },
            },
          },
        },
      },
    });
    
    res.json(team);
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

// Get a specific team
teamRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { id } = req.params;
    
    const team = await prisma.team.findFirst({
      where: {
        id,
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                picture: true,
              },
            },
          },
        },
        calendars: true,
      },
    });
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    res.json(team);
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

// Update a team
teamRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { id } = req.params;
    const { name, description } = req.body;
    
    // Check if user is owner or admin
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId: id,
        userId,
        role: { in: ['owner', 'admin'] },
      },
    });
    
    if (!membership) {
      return res.status(403).json({ error: 'Not authorized to update team' });
    }
    
    const team = await prisma.team.update({
      where: { id },
      data: {
        name: name || undefined,
        description: description !== undefined ? description : undefined,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                picture: true,
              },
            },
          },
        },
      },
    });
    
    res.json(team);
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({ error: 'Failed to update team' });
  }
});

// Delete a team
teamRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { id } = req.params;
    
    // Check if user is owner
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId: id,
        userId,
        role: 'owner',
      },
    });
    
    if (!membership) {
      return res.status(403).json({ error: 'Only owner can delete team' });
    }
    
    await prisma.team.delete({
      where: { id },
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ error: 'Failed to delete team' });
  }
});

// Add member to team
teamRouter.post('/:id/members', async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { id } = req.params;
    const { email, role = 'member' } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Check if user is owner or admin
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId: id,
        userId,
        role: { in: ['owner', 'admin'] },
      },
    });
    
    if (!membership) {
      return res.status(403).json({ error: 'Not authorized to add members' });
    }
    
    // Find user by email
    const targetUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Add member
    const teamMember = await prisma.teamMember.create({
      data: {
        teamId: id,
        userId: targetUser.id,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            picture: true,
          },
        },
      },
    });
    
    res.json(teamMember);
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// Remove member from team
teamRouter.delete('/:id/members/:memberId', async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { id, memberId } = req.params;
    
    // Check if user is owner or admin
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId: id,
        userId,
        role: { in: ['owner', 'admin'] },
      },
    });
    
    if (!membership) {
      return res.status(403).json({ error: 'Not authorized to remove members' });
    }
    
    // Can't remove owner
    const targetMember = await prisma.teamMember.findUnique({
      where: { id: memberId },
    });
    
    if (targetMember?.role === 'owner') {
      return res.status(400).json({ error: 'Cannot remove team owner' });
    }
    
    await prisma.teamMember.delete({
      where: { id: memberId },
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// Add calendar to team
teamRouter.post('/:id/calendars', async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { id } = req.params;
    const { calendarId, name, color } = req.body;
    
    if (!calendarId || !name) {
      return res.status(400).json({ error: 'Calendar ID and name are required' });
    }
    
    // Check if user is member of team
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId: id,
        userId,
      },
    });
    
    if (!membership) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const teamCalendar = await prisma.teamCalendar.create({
      data: {
        teamId: id,
        calendarId,
        name,
        color: color || null,
      },
    });
    
    res.json(teamCalendar);
  } catch (error) {
    console.error('Add calendar error:', error);
    res.status(500).json({ error: 'Failed to add calendar' });
  }
});
