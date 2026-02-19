import { google, calendar_v3 } from 'googleapis';

// OAuth2 scopes required for calendar access
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'openid',
];

// Create OAuth2 client
export const createOAuth2Client = () => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  
  return oauth2Client;
};

// Generate authorization URL
export const getAuthUrl = (state?: string) => {
  const oauth2Client = createOAuth2Client();
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state,
  });
};

// Exchange authorization code for tokens
export const getTokensFromCode = async (code: string) => {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

// Get user info from tokens
export const getUserInfo = async (accessToken: string) => {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  const oauth2 = google.oauth2({
    auth: oauth2Client,
    version: 'v2',
  });
  
  const { data } = await oauth2.userinfo.get();
  return data;
};

// Refresh access token
export const refreshAccessToken = async (refreshToken: string) => {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials;
};

// Create authenticated calendar API client
export const getCalendarClient = (accessToken: string, refreshToken?: string) => {
  const oauth2Client = createOAuth2Client();
  
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  
  // Handle token refresh
  oauth2Client.on('tokens', (tokens) => {
    if (tokens.access_token) {
      console.log('Tokens refreshed:', tokens.access_token.substring(0, 10) + '...');
    }
  });
  
  return google.calendar({ version: 'v3', auth: oauth2Client });
};

// Calendar API helper functions
export const calendarApi = {
  // List all calendars
  listCalendars: async (accessToken: string, refreshToken?: string) => {
    const calendar = getCalendarClient(accessToken, refreshToken);
    const response = await calendar.calendarList.list();
    return response.data.items || [];
  },
  
  // Get events from a calendar
  getEvents: async (
    accessToken: string,
    calendarId: string,
    timeMin: string,
    timeMax: string,
    refreshToken?: string
  ) => {
    const calendar = getCalendarClient(accessToken, refreshToken);
    const response = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });
    return response.data.items || [];
  },
  
  // Create an event
  createEvent: async (
    accessToken: string,
    calendarId: string,
    event: calendar_v3.Schema$Event,
    refreshToken?: string
  ) => {
    const calendar = getCalendarClient(accessToken, refreshToken);
    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });
    return response.data;
  },
  
  // Update an event
  updateEvent: async (
    accessToken: string,
    calendarId: string,
    eventId: string,
    event: calendar_v3.Schema$Event,
    refreshToken?: string
  ) => {
    const calendar = getCalendarClient(accessToken, refreshToken);
    const response = await calendar.events.update({
      calendarId,
      eventId,
      requestBody: event,
    });
    return response.data;
  },
  
  // Delete an event
  deleteEvent: async (
    accessToken: string,
    calendarId: string,
    eventId: string,
    refreshToken?: string
  ) => {
    const calendar = getCalendarClient(accessToken, refreshToken);
    await calendar.events.delete({
      calendarId,
      eventId,
    });
  },
  
  // Watch for calendar changes (push notifications)
  watchCalendar: async (
    accessToken: string,
    calendarId: string,
    webhookUrl: string,
    refreshToken?: string
  ) => {
    const calendar = getCalendarClient(accessToken, refreshToken);
    const response = await calendar.events.watch({
      calendarId,
      requestBody: {
        id: `teamcal-${Date.now()}`,
        type: 'web_hook',
        address: webhookUrl,
      },
    });
    return response.data;
  },
};

export default calendarApi;
