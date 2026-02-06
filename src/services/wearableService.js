// ExtensioVitae - Wearable Integration Service
// Handles OAuth flow and data sync for Oura, WHOOP, etc.

import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// OAuth Configuration
const OAUTH_CONFIG = {
    oura: {
        clientId: import.meta.env.VITE_OURA_CLIENT_ID,
        authUrl: 'https://cloud.ouraring.com/oauth/authorize',
        tokenUrl: 'https://api.ouraring.com/oauth/token',
        scopes: ['daily', 'heartrate', 'workout', 'sleep', 'personal'],
        redirectUri: `${window.location.origin}/oauth/oura/callback`,
    },
    whoop: {
        clientId: import.meta.env.VITE_WHOOP_CLIENT_ID,
        authUrl: 'https://api.prod.whoop.com/oauth/authorize',
        tokenUrl: 'https://api.prod.whoop.com/oauth/token',
        scopes: ['read:recovery', 'read:sleep', 'read:cycles', 'read:workout', 'read:profile'],
        redirectUri: `${window.location.origin}/oauth/whoop/callback`,
    },
};

/**
 * Initiate OAuth flow for a wearable device
 */
export const initiateOAuth = (deviceType) => {
    const config = OAUTH_CONFIG[deviceType];

    if (!config) {
        throw new Error(`Unsupported device type: ${deviceType}`);
    }

    if (!config.clientId) {
        throw new Error(`${deviceType} Client ID not configured. Check your .env file.`);
    }

    // Build OAuth URL
    const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        response_type: 'code',
        scope: config.scopes.join(' '),
        state: deviceType, // Pass device type in state
    });

    const authUrl = `${config.authUrl}?${params.toString()}`;

    // Redirect to OAuth provider
    window.location.href = authUrl;
};

/**
 * Handle OAuth callback and exchange code for tokens
 */
export const handleOAuthCallback = async (deviceType, code) => {
    const config = OAUTH_CONFIG[deviceType];

    if (!config) {
        throw new Error(`Unsupported device type: ${deviceType}`);
    }

    // Exchange code for tokens
    const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: config.redirectUri,
            client_id: config.clientId,
            client_secret: import.meta.env[`VITE_${deviceType.toUpperCase()}_CLIENT_SECRET`],
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to exchange OAuth code: ${error}`);
    }

    const tokens = await response.json();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error('User not authenticated');
    }

    // Store connection in database
    const { data, error } = await supabase
        .from('wearable_connections')
        .upsert({
            user_id: user.id,
            device_type: deviceType,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
            sync_status: 'active',
            connected_at: new Date().toISOString(),
        }, {
            onConflict: 'user_id,device_type',
        });

    if (error) {
        throw new Error(`Failed to save connection: ${error.message}`);
    }

    return data;
};

/**
 * Get user's wearable connections
 */
export const getWearableConnections = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
        .from('wearable_connections')
        .select('*')
        .eq('user_id', user.id);

    if (error) {
        throw new Error(`Failed to fetch connections: ${error.message}`);
    }

    return data || [];
};

/**
 * Disconnect a wearable device
 */
export const disconnectWearable = async (deviceType) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error('User not authenticated');
    }

    const { error } = await supabase
        .from('wearable_connections')
        .delete()
        .eq('user_id', user.id)
        .eq('device_type', deviceType);

    if (error) {
        throw new Error(`Failed to disconnect: ${error.message}`);
    }
};

/**
 * Trigger manual sync for a device
 */
export const syncWearableData = async (deviceType) => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
        throw new Error('User not authenticated');
    }

    const functionName = `sync-${deviceType}-data`;

    const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Sync failed');
    }

    return await response.json();
};

/**
 * Calculate recovery score for a specific date
 */
export const calculateRecoveryScore = async (date = null) => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
        throw new Error('User not authenticated');
    }

    const targetDate = date || new Date().toISOString().split('T')[0];

    const response = await fetch(`${SUPABASE_URL}/functions/v1/calculate-recovery-score`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: targetDate }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Recovery calculation failed');
    }

    return await response.json();
};

/**
 * Get recovery metrics for a date range
 */
export const getRecoveryMetrics = async (startDate, endDate) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
        .from('recovery_metrics')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

    if (error) {
        throw new Error(`Failed to fetch recovery metrics: ${error.message}`);
    }

    return data || [];
};

/**
 * Get user's recovery baseline
 */
export const getRecoveryBaseline = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
        .from('user_recovery_baseline')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (error && error.code !== 'PGRST116') { // Ignore "not found" error
        throw new Error(`Failed to fetch baseline: ${error.message}`);
    }

    return data;
};

export default {
    initiateOAuth,
    handleOAuthCallback,
    getWearableConnections,
    disconnectWearable,
    syncWearableData,
    calculateRecoveryScore,
    getRecoveryMetrics,
    getRecoveryBaseline,
};
