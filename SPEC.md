# TeamCal - Google Calendar's Missing Schedule View

## Project Overview

**Project Name:** TeamCal  
**Type:** Full-stack Web Application  
**Core Functionality:** A team scheduling application that enhances Google Calendar with team management, schedule views, and collaborative planning features.  
**Target Users:** Team managers, HR professionals, and organizations needing to coordinate employee schedules, rotations, and time-off.

---

## Technology Stack

- **Frontend:** Next.js 14 with React, TypeScript
- **Backend:** Express.js with TypeScript
- **Database:** SQLite with Prisma ORM
- **Authentication:** Google OAuth 2.0
- **Calendar API:** Google Calendar API v3
- **Styling:** Custom CSS with CSS Variables

---

## UI/UX Specification

### Color Palette

```css
--primary: #3F51B5;          /* Indigo - main brand color */
--primary-light: #7986CB;    /* Lighter indigo */
--primary-dark: #303F9F;     /* Darker indigo */
--accent: #40C4FF;           /* Light blue accent */
--success: #4CAF50;          /* Green for confirmations */
--warning: #FF9800;          /* Orange for warnings */
--danger: #F44336;          /* Red for errors/deletions */
--background: #FAFAFA;       /* Light gray background */
--surface: #FFFFFF;          /* White cards/panels */
--text-primary: #212121;     /* Dark text */
--text-secondary: #757575;   /* Secondary text */
--border: #E0E0E0;           /* Border color */
--schedule-view-bg: #E8EAF6; /* Light indigo for schedule */
```

### Typography

- **Primary Font:** 'Inter', sans-serif (modern, clean)
- **Headings:** 'DM Sans', sans-serif (distinctive, readable)
- **Monospace:** 'JetBrains Mono' (for times/dates)

**Font Sizes:**
- H1: 2.5rem (40px)
- H2: 2rem (32px)
- H3: 1.5rem (24px)
- Body: 1rem (16px)
- Small: 0.875rem (14px)
- Caption: 0.75rem (12px)

### Layout Structure

**1. Header (64px height)**
- Logo (left)
- Navigation: Dashboard, Schedule, Teams, Settings
- User profile dropdown (right)
- Dark/light theme toggle

**2. Sidebar (280px width, collapsible)**
- Team selector dropdown
- Calendar visibility toggles
- Quick filters (My Calendar, Team, Holidays)
- Mini calendar for date selection

**3. Main Content Area**
- Top bar with date navigation (< Today >)
- View toggle (Day, Week, Month, Schedule)
- Schedule grid (horizontal timeline view)
- Event details panel (slide-in)

**4. Schedule View (Key Feature)**
- Horizontal timeline with time slots (rows)
- Team members as vertical columns
- Events displayed as colored blocks
- Drag-and-drop support
- Color-coded by event type

### Responsive Breakpoints

- **Desktop:** > 1200px (full layout)
- **Tablet:** 768px - 1200px (collapsed sidebar)
- **Mobile:** < 768px (bottom navigation, stacked views)

### Visual Effects

- **Shadows:** 
  - Card: `0 2px 8px rgba(0,0,0,0.08)`
  - Elevated: `0 4px 16px rgba(0,0,0,0.12)`
  - Modal: `0 8px 32px rgba(0,0,0,0.16)`
- **Border Radius:** 8px (cards), 4px (buttons), 12px (modals)
- **Transitions:** 200ms ease-out (default), 300ms ease (modals)
- **Hover Effects:** Scale 1.02 on cards, color shift on buttons

---

## Functionality Specification

### Core Features

#### 1. Google OAuth Authentication
- Sign in with Google button
- OAuth 2.0 flow with proper scopes
- Token refresh handling
- Logout with token revocation
- Persistent sessions

#### 2. Google Calendar Integration
- Fetch user's primary calendar
- Fetch all user calendars
- Create/Update/Delete events
- Real-time sync with Google Calendar
- Two-way sync (changes reflect immediately)
- Calendar color management

#### 3. Schedule View (Hero Feature)
- Horizontal timeline layout
- Multiple calendar overlay
- Time-based event positioning
- Zoom levels (hour, half-hour, 15-min)
- Date range navigation
- Today indicator
- Event overlap handling

#### 4. Team Management
- Create teams/groups
- Add/remove team members
- Share calendars with team
- Team-level permissions
- Team schedule visibility settings

#### 5. Event Management
- Create events (title, time, description, attendees)
- Edit events inline
- Delete with confirmation
- Drag to reschedule
- Recurring events support
- Event color customization
- Event categories (shift, vacation, meeting, etc.)

#### 6. Sharing & Export
- Public schedule embed
- PDF export
- Print-friendly view
- Email schedule
- iCal feed generation

### User Interactions

1. **Login Flow:** Landing → Google Sign In → OAuth → Dashboard
2. **View Schedule:** Dashboard → Select date → Choose view → Browse events
3. **Create Event:** Click empty slot → Quick add form → Save → Sync to Google
4. **Manage Team:** Settings → Teams → Add member → Set permissions
5. **Share Schedule:** Settings → Sharing → Generate embed code

### Data Handling

- **User Data:** Stored locally with encrypted tokens
- **Team Data:** SQLite with Prisma migrations
- **Calendar Cache:** 5-minute TTL cache
- **Offline Support:** Service worker for PWA

### Edge Cases

- Handle Google API rate limits
- Offline mode with queue for changes
- Calendar permission revoked mid-session
- Multiple calendars with same name
- Event conflicts detection
- Timezone handling for distributed teams

---

## API Endpoints

### Authentication
- `GET /auth/google` - Initiate OAuth
- `GET /auth/google/callback` - OAuth callback
- `POST /auth/logout` - Logout user
- `GET /auth/me` - Get current user

### Calendar
- `GET /api/calendars` - List all calendars
- `GET /api/calendars/:id/events` - Get events from calendar
- `POST /api/calendars/:id/events` - Create event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Teams
- `GET /api/teams` - List user's teams
- `POST /api/teams` - Create team
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team
- `POST /api/teams/:id/members` - Add member
- `DELETE /api/teams/:id/members/:userId` - Remove member

---

## Acceptance Criteria

### Authentication
- [ ] User can sign in with Google
- [ ] Session persists on refresh
- [ ] User can sign out
- [ ] Invalid tokens redirect to login

### Calendar
- [ ] User's Google calendars load
- [ ] Events display in schedule view
- [ ] Events sync to Google Calendar
- [ ] New Google events appear in app

### Schedule View
- [ ] Horizontal timeline renders correctly
- [ ] Multiple calendars overlay properly
- [ ] Events position by time accurately
- [ ] Date navigation works
- [ ] Today button jumps to current time

### Team Management
- [ ] Teams can be created
- [ ] Members can be added
- [ ] Team schedules are visible
- [ ] Permissions are enforced

### Performance
- [ ] Initial load < 3 seconds
- [ ] Calendar fetch < 2 seconds
- [ ] Smooth scrolling in schedule view
- [ ] No layout shift on data load
