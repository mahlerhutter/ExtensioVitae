/**
 * Google Calendar API Client
 * Handles OAuth flow and calendar event fetching
 */

// Google OAuth Configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/calendar/callback`;
const GOOGLE_SCOPES = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events.readonly'
].join(' ');

/**
 * Generate Google OAuth URL
 */
export function getGoogleAuthUrl() {
    const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: GOOGLE_REDIRECT_URI,
        response_type: 'code',
        scope: GOOGLE_SCOPES,
        access_type: 'offline', // Get refresh token
        prompt: 'consent' // Force consent screen to get refresh token
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 * @param {string} code - Authorization code from OAuth callback
 * @returns {Promise<{access_token, refresh_token, expires_in}>}
 */
export async function exchangeCodeForTokens(code) {
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            code,
            client_id: GOOGLE_CLIENT_ID,
            client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
            redirect_uri: GOOGLE_REDIRECT_URI,
            grant_type: 'authorization_code'
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Token exchange failed: ${error.error_description || error.error}`);
    }

    return response.json();
}

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<{access_token, expires_in}>}
 */
export async function refreshAccessToken(refreshToken) {
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            refresh_token: refreshToken,
            client_id: GOOGLE_CLIENT_ID,
            client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
            grant_type: 'refresh_token'
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Token refresh failed: ${error.error_description || error.error}`);
    }

    return response.json();
}

/**
 * Fetch calendar events from Google Calendar
 * @param {string} accessToken - Valid access token
 * @param {object} options - Query options
 * @returns {Promise<Array>} Calendar events
 */
export async function fetchCalendarEvents(accessToken, options = {}) {
    const {
        timeMin = new Date().toISOString(),
        timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ahead
        maxResults = 100,
        singleEvents = true,
        orderBy = 'startTime'
    } = options;

    const params = new URLSearchParams({
        timeMin,
        timeMax,
        maxResults: maxResults.toString(),
        singleEvents: singleEvents.toString(),
        orderBy
    });

    const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json'
            }
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to fetch events: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.items || [];
}

/**
 * Parse Google Calendar event to our format
 * @param {object} googleEvent - Raw Google Calendar event
 * @returns {object} Normalized event
 */
export function parseGoogleEvent(googleEvent) {
    return {
        event_id: googleEvent.id,
        title: googleEvent.summary || '(No title)',
        description: googleEvent.description || '',
        start_time: googleEvent.start.dateTime || googleEvent.start.date,
        end_time: googleEvent.end.dateTime || googleEvent.end.date,
        location: googleEvent.location || '',
        attendees: (googleEvent.attendees || []).map(a => ({
            email: a.email,
            displayName: a.displayName,
            responseStatus: a.responseStatus
        })),
        is_all_day: !googleEvent.start.dateTime, // If no dateTime, it's all-day
        metadata: {
            htmlLink: googleEvent.htmlLink,
            creator: googleEvent.creator,
            organizer: googleEvent.organizer,
            status: googleEvent.status,
            visibility: googleEvent.visibility
        }
    };
}

/**
 * Get user's calendar info
 * @param {string} accessToken - Valid access token
 * @returns {Promise<object>} Calendar info
 */
export async function getCalendarInfo(accessToken) {
    const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary',
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json'
            }
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to fetch calendar info: ${error.error?.message || 'Unknown error'}`);
    }

    return response.json();
}

/**
 * Revoke Google Calendar access
 * @param {string} accessToken - Access token to revoke
 */
export async function revokeAccess(accessToken) {
    const response = await fetch(
        `https://oauth2.googleapis.com/revoke?token=${accessToken}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }
    );

    if (!response.ok) {
        throw new Error('Failed to revoke access');
    }

    return true;
}
