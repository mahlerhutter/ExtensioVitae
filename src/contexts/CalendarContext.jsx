import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    getGoogleAuthUrl,
    exchangeCodeForTokens,
    refreshAccessToken,
    fetchCalendarEvents,
    parseGoogleEvent,
    getCalendarInfo,
    revokeAccess
} from '../lib/googleCalendar';
import { detectAll, detectBusyWeekFromEvents } from '../lib/calendarDetection';
import { useMode } from './ModeContext';
import { useToast } from '../components/Toast';

const CalendarContext = createContext();

const CALENDAR_STORAGE_KEY = 'extensiovitae_calendar_connection';

export const CalendarProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connection, setConnection] = useState(null);
    const [events, setEvents] = useState([]);
    const [detections, setDetections] = useState([]);
    const [settings, setSettings] = useState({
        auto_activate_travel: true,
        auto_activate_deep_work: true,
        auto_activate_sick: false,
        alert_busy_weeks: true,
        sync_frequency_hours: 6
    });
    const [lastSync, setLastSync] = useState(null);
    const [isSyncing, setIsSyncing] = useState(false);

    const { activateMode } = useMode();
    const { addToast } = useToast();

    // Load connection status from localStorage on mount
    useEffect(() => {
        loadConnection();
    }, []);

    /**
     * Load calendar connection from Supabase
     */
    const loadConnection = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Load connection
            const { data: conn, error: connError } = await supabase
                .from('calendar_connections')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .single();

            if (connError && connError.code !== 'PGRST116') { // PGRST116 = no rows
                console.error('Error loading connection:', connError);
                return;
            }

            if (conn) {
                setConnection(conn);
                setIsConnected(true);

                // Load settings
                await loadSettings();

                // Load events
                await loadEvents();
            }
        } catch (error) {
            console.error('Error loading connection:', error);
        }
    };

    /**
     * Load calendar settings
     */
    const loadSettings = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('calendar_settings')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error loading settings:', error);
                return;
            }

            if (data) {
                setSettings(data);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    /**
     * Load calendar events from Supabase
     */
    const loadEvents = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('calendar_events')
                .select('*')
                .eq('user_id', user.id)
                .gte('start_time', new Date().toISOString())
                .order('start_time', { ascending: true })
                .limit(100);

            if (error) {
                console.error('Error loading events:', error);
                return;
            }

            setEvents(data || []);

            // Load detections
            await loadDetections();
        } catch (error) {
            console.error('Error loading events:', error);
        }
    };

    /**
     * Load calendar detections
     */
    const loadDetections = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('calendar_detections')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error('Error loading detections:', error);
                return;
            }

            setDetections(data || []);
        } catch (error) {
            console.error('Error loading detections:', error);
        }
    };

    /**
     * Start OAuth flow
     */
    const connectCalendar = () => {
        setIsConnecting(true);
        const authUrl = getGoogleAuthUrl();

        // Open OAuth popup
        const width = 500;
        const height = 600;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
            authUrl,
            'Google Calendar Authorization',
            `width=${width},height=${height},left=${left},top=${top}`
        );

        // Listen for OAuth callback
        window.addEventListener('message', handleOAuthCallback);
    };

    /**
     * Handle OAuth callback
     */
    const handleOAuthCallback = async (event) => {
        // Verify origin
        if (event.origin !== window.location.origin) return;

        const { code, error } = event.data;

        if (error) {
            console.error('OAuth error:', error);
            addToast('Calendar connection failed', 'error');
            setIsConnecting(false);
            return;
        }

        if (code) {
            try {
                // Exchange code for tokens
                const tokens = await exchangeCodeForTokens(code);

                // Get calendar info
                const calendarInfo = await getCalendarInfo(tokens.access_token);

                // Save to Supabase
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('Not authenticated');

                const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

                const { data: conn, error: connError } = await supabase
                    .from('calendar_connections')
                    .upsert({
                        user_id: user.id,
                        provider: 'google',
                        access_token: tokens.access_token,
                        refresh_token: tokens.refresh_token,
                        expires_at: expiresAt.toISOString(),
                        scope: tokens.scope,
                        email: calendarInfo.id,
                        is_active: true
                    })
                    .select()
                    .single();

                if (connError) throw connError;

                setConnection(conn);
                setIsConnected(true);
                setIsConnecting(false);

                // Create default settings
                await supabase
                    .from('calendar_settings')
                    .upsert({
                        user_id: user.id,
                        ...settings
                    });

                addToast('✅ Calendar connected!', 'success');

                // Start first sync
                await syncCalendar();

            } catch (error) {
                console.error('Error saving connection:', error);
                addToast('Failed to save calendar connection', 'error');
                setIsConnecting(false);
            }
        }

        // Remove event listener
        window.removeEventListener('message', handleOAuthCallback);
    };

    /**
     * Sync calendar events from Google
     */
    const syncCalendar = async () => {
        if (!connection) return;

        setIsSyncing(true);

        try {
            // Check if token needs refresh
            const expiresAt = new Date(connection.expires_at);
            const now = new Date();

            let accessToken = connection.access_token;

            if (expiresAt <= now) {
                // Refresh token
                const tokens = await refreshAccessToken(connection.refresh_token);
                accessToken = tokens.access_token;

                // Update connection
                const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

                const { data: updatedConn } = await supabase
                    .from('calendar_connections')
                    .update({
                        access_token: tokens.access_token,
                        expires_at: newExpiresAt.toISOString()
                    })
                    .eq('id', connection.id)
                    .select()
                    .single();

                setConnection(updatedConn);
            }

            // Fetch events from Google
            const googleEvents = await fetchCalendarEvents(accessToken);

            // Parse and save events
            const { data: { user } } = await supabase.auth.getUser();

            for (const googleEvent of googleEvents) {
                const parsedEvent = parseGoogleEvent(googleEvent);

                await supabase
                    .from('calendar_events')
                    .upsert({
                        user_id: user.id,
                        connection_id: connection.id,
                        ...parsedEvent
                    });
            }

            // Reload events
            await loadEvents();

            // Run detections
            await runDetections();

            setLastSync(new Date());
            addToast('📅 Calendar synced!', 'success');

        } catch (error) {
            console.error('Error syncing calendar:', error);
            addToast('Failed to sync calendar', 'error');
        } finally {
            setIsSyncing(false);
        }
    };

    /**
     * Run detection algorithms on events
     */
    const runDetections = async () => {
        if (events.length === 0) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const newDetections = [];

            // Run individual event detections
            for (const event of events) {
                const eventDetections = detectAll(event);

                for (const detection of eventDetections) {
                    // Save detection
                    const { data } = await supabase
                        .from('calendar_detections')
                        .insert({
                            user_id: user.id,
                            event_id: event.id,
                            detection_type: detection.type,
                            confidence: detection.confidence,
                            metadata: detection.metadata,
                            mode_activated: detection.mode
                        })
                        .select()
                        .single();

                    if (data) {
                        newDetections.push(data);

                        // Auto-activate mode if enabled
                        if (detection.mode && shouldAutoActivate(detection.type)) {
                            await handleAutoActivation(detection, data.id);
                        }
                    }
                }
            }

            // Run busy week detection
            const busyWeek = detectBusyWeekFromEvents(events);
            if (busyWeek && settings.alert_busy_weeks) {
                addToast(busyWeek.alert.title, 'warning');
            }

            // Reload detections
            await loadDetections();

        } catch (error) {
            console.error('Error running detections:', error);
        }
    };

    /**
     * Check if auto-activation is enabled for detection type
     */
    const shouldAutoActivate = (detectionType) => {
        switch (detectionType) {
            case 'flight':
                return settings.auto_activate_travel;
            case 'focus_block':
                return settings.auto_activate_deep_work;
            default:
                return false;
        }
    };

    /**
     * Handle auto-activation of Emergency Mode
     */
    const handleAutoActivation = async (detection, detectionId) => {
        try {
            // Activate mode
            activateMode(detection.mode, {
                trigger: 'calendar_auto_activation',
                detection_type: detection.type,
                confidence: detection.confidence
            });

            // Update detection with activation time
            await supabase
                .from('calendar_detections')
                .update({
                    mode_activation_time: new Date().toISOString()
                })
                .eq('id', detectionId);

            // Show notification
            const modeNames = {
                TRAVEL: 'Travel',
                DEEP_WORK: 'Deep Work',
                SICK: 'Sick',
                DETOX: 'Detox'
            };

            addToast(`🎯 ${modeNames[detection.mode]} Mode activated`, 'success');

        } catch (error) {
            console.error('Error auto-activating mode:', error);
        }
    };

    /**
     * Update calendar settings
     */
    const updateSettings = async (newSettings) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('calendar_settings')
                .update(newSettings)
                .eq('user_id', user.id);

            if (error) throw error;

            setSettings({ ...settings, ...newSettings });
            addToast('Settings updated', 'success');

        } catch (error) {
            console.error('Error updating settings:', error);
            addToast('Failed to update settings', 'error');
        }
    };

    /**
     * Disconnect calendar
     */
    const disconnectCalendar = async () => {
        if (!connection) return;

        try {
            // Revoke access with Google
            await revokeAccess(connection.access_token);

            // Delete from Supabase
            await supabase
                .from('calendar_connections')
                .update({ is_active: false })
                .eq('id', connection.id);

            setConnection(null);
            setIsConnected(false);
            setEvents([]);
            setDetections([]);

            addToast('Calendar disconnected', 'success');

        } catch (error) {
            console.error('Error disconnecting calendar:', error);
            addToast('Failed to disconnect calendar', 'error');
        }
    };

    const value = {
        // State
        isConnected,
        isConnecting,
        connection,
        events,
        detections,
        settings,
        lastSync,
        isSyncing,

        // Actions
        connectCalendar,
        disconnectCalendar,
        syncCalendar,
        updateSettings,
        loadEvents,
        loadDetections
    };

    return (
        <CalendarContext.Provider value={value}>
            {children}
        </CalendarContext.Provider>
    );
};

/**
 * Hook to use calendar context
 */
export const useCalendar = () => {
    const context = useContext(CalendarContext);
    if (!context) {
        throw new Error('useCalendar must be used within a CalendarProvider');
    }
    return context;
};

export default CalendarContext;
