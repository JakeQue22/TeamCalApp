# TeamCal - Google Calendar's Missing Schedule View

A powerful team scheduling application that enhances Google Calendar with team management, schedule views, and collaborative planning features. Perfect for managing staff rotations, on-call duty times, and team vacations.

![TeamCal](https://img.shields.io/badge/Version-1.0.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)

## Features

- 📅 **Schedule View** - Horizontal timeline showing multiple team calendars side by side
- 🔗 **Google Calendar Integration** - Seamless two-way sync with Google Calendar
- 👥 **Team Management** - Create teams, add members, manage permissions
- 📊 **Visual Analytics** - Identify patterns and optimize coverage
- 📤 **Export & Share** - Embed schedules, PDF export, print support
- 📱 **Mobile Friendly** - Works on phones, tablets, and desktops

## Tech Stack

- **Frontend:** Next.js 14, React, TypeScript
- **Backend:** Express.js, TypeScript
- **Database:** SQLite with Prisma ORM
- **Authentication:** Google OAuth 2.0
- **Calendar API:** Google Calendar API v3

## Getting Started

### Prerequisites

- Node.js 18+
- Google Cloud Console account
- npm or yarn
- Docker & Docker Compose (optional, for containerized setup)

### Option A: Docker Compose (Recommended)

The easiest way to run TeamCal is with Docker Compose. All services are bound to `0.0.0.0` so they're accessible from any network interface.

1. **Set up environment variables**

```bash
cp .env.example .env
```

Edit `.env` and fill in your Google OAuth credentials (see "Set up Google OAuth" below).

2. **Start with Docker Compose**

```bash
docker compose up --build
```

The application will be available at:
- Frontend: http://0.0.0.0:3000
- Backend API: http://0.0.0.0:3001

To run in the background:

```bash
docker compose up --build -d
```

To stop:

```bash
docker compose down
```

SQLite data is persisted in a Docker volume (`sqlite-data`). To reset the database:

```bash
docker compose down -v
```

### Option B: Local Development

1. **Clone the repository**

```bash
cd teamcalapp
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Copy `.env.example` to `.env` and fill in your credentials:

```env
# Google OAuth - Get from https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback

# Session secret
SESSION_SECRET=your_random_secret

# Server
PORT=3001
NODE_ENV=development
```

4. **Initialize the database**

```bash
npm run db:generate
npm run db:push
```

5. **Start development servers**

```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Set up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID credentials
3. Add `http://localhost:3001/auth/google/callback` to authorized redirect URIs
4. Add `http://localhost:3000` to authorized JavaScript origins

If using Docker with `0.0.0.0`, also add:
- `http://0.0.0.0:3001/auth/google/callback` to authorized redirect URIs
- `http://0.0.0.0:3000` to authorized JavaScript origins

## Project Structure

```
teamcalapp/
├── prisma/                  # Database schema
│   └── schema.prisma
├── server/                  # Express backend
│   ├── index.ts            # Server entry point
│   ├── db.ts              # Prisma client
│   ├── google.ts           # Google API helpers
│   └── routes/             # API routes
│       ├── auth.ts         # Authentication
│       ├── calendar.ts     # Calendar endpoints
│       ├── events.ts       # Event management
│       └── teams.ts        # Team management
├── src/
│   ├── app/               # Next.js frontend
│   │   ├── layout.tsx
│   │   ├── page.tsx      # Landing page
│   │   ├── globals.css
│   │   └── dashboard/     # Dashboard
│   │       └── page.tsx
│   └── ...
├── Dockerfile              # Container build
├── docker-compose.yml      # Docker Compose setup
├── .dockerignore
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

## API Endpoints

### Authentication
- `GET /auth/google` - Initiate OAuth
- `GET /auth/google/callback` - OAuth callback
- `POST /auth/logout` - Logout
- `GET /auth/me` - Get current user

### Calendar
- `GET /api/calendars` - List calendars
- `GET /api/calendars/events` - Get events
- `POST /api/calendars/:id/events` - Create event

### Teams
- `GET /api/teams` - List teams
- `POST /api/teams` - Create team
- `POST /api/teams/:id/members` - Add member

## Usage

1. **Sign in** with your Google account
2. **Connect calendars** - Select which calendars to display
3. **Create teams** - Add team members and manage permissions
4. **View schedules** - Use the Schedule view to see team availability
5. **Create events** - Click on the calendar to add new events

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this for your own projects.

## Acknowledgments

- Inspired by [TeamCalApp](https://teamcalapp.com)
- Built with [Google Calendar API](https://developers.google.com/calendar/api)
