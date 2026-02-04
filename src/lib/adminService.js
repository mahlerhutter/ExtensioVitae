/**
 * Admin Service
 * 
 * Handles server-side admin authentication via Supabase Edge Functions
 * Replaces client-side admin email checks for security
 */

import { supabase } from './supabase';
import { logger } from './logger';

/**
 * Check if the current user has admin access
 * Calls server-side Edge Function to verify admin status
 * 
 * @param {Object} session - Supabase session object
 * @returns {Promise<boolean>} True if user is admin
 */
export async function checkAdminStatus(session) {
    if (!session?.access_token) {
        logger.warn('[AdminService] No session provided');
        return false;
    }

    try {
        // Call the check-admin Edge Function
        const { data, error } = await supabase.functions.invoke('check-admin', {
            headers: {
                Authorization: `Bearer ${session.access_token}`,
            },
        });

        if (error) {
            logger.error('[AdminService] Edge Function error:', error);
            return false;
        }

        if (data?.isAdmin) {
            logger.info('[AdminService] Admin access granted for:', data.email);
            return true;
        }

        logger.warn('[AdminService] Admin access denied for:', data?.email);
        return false;
    } catch (error) {
        logger.error('[AdminService] Failed to check admin status:', error);
        return false;
    }
}

/**
 * Get admin status with detailed response
 * 
 * @param {Object} session - Supabase session object
 * @returns {Promise<{isAdmin: boolean, email: string, userId: string}>}
 */
export async function getAdminDetails(session) {
    if (!session?.access_token) {
        return { isAdmin: false, email: null, userId: null };
    }

    try {
        const { data, error } = await supabase.functions.invoke('check-admin', {
            headers: {
                Authorization: `Bearer ${session.access_token}`,
            },
        });

        if (error) {
            logger.error('[AdminService] Edge Function error:', error);
            return { isAdmin: false, email: null, userId: null };
        }

        return {
            isAdmin: data?.isAdmin || false,
            email: data?.email || null,
            userId: data?.userId || null,
        };
    } catch (error) {
        logger.error('[AdminService] Failed to get admin details:', error);
        return { isAdmin: false, email: null, userId: null };
    }
}
