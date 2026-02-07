import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    signInWithGoogle,
    signOut as supabaseSignOut,
    getSession,
    getCurrentUser,
    onAuthStateChange,
    isAuthAvailable
} from '../lib/supabase';

import { identifyUser, resetUser, trackLogin } from '../lib/analytics';
import { logger } from '../lib/logger';

// Create the auth context
const AuthContext = createContext({
    user: null,
    session: null,
    loading: true,
    isAuthenticated: false,
    signInWithGoogle: async () => { },
    signOut: async () => { },
});

// Custom hook to use auth context
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Auth Provider component
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthAvailable()) {
            logger.info('[Auth] Supabase not configured, using localStorage mode');
            setLoading(false);
            return;
        }

        // Get initial session
        const initAuth = async () => {
            try {
                const { session } = await getSession();
                setSession(session);

                if (session) {
                    const { user } = await getCurrentUser();
                    setUser(user);
                }
            } catch (error) {
                logger.error('[Auth] Error initializing auth:', error);
            } finally {
                setLoading(false);
            }
        };

        initAuth();

        // Subscribe to auth changes
        const unsubscribe = onAuthStateChange((event, session) => {
            logger.debug('[Auth] Auth state changed:', event);
            setSession(session);
            setUser(session?.user ?? null);

            if (event === 'SIGNED_IN' && session?.user) {
                // Identify user in analytics
                identifyUser(session.user.id, {
                    email: session.user.email,
                });
                trackLogin('google');
            }

            if (event === 'SIGNED_OUT') {
                // Clear any cached user data
                setUser(null);
                setSession(null);
                // Reset analytics user
                resetUser();
            }
        });

        return () => unsubscribe();
    }, []);

    // Handle Google sign in
    const handleSignInWithGoogle = async () => {
        try {
            const { error } = await signInWithGoogle();
            if (error) {
                logger.error('[Auth] Google sign in error:', error);
                throw error;
            }
        } catch (error) {
            logger.error('[Auth] Sign in failed:', error);
            throw error;
        }
    };

    // Handle sign out
    const handleSignOut = async () => {
        try {
            const { error } = await supabaseSignOut();
            if (error) {
                logger.error('[Auth] Sign out error:', error);
                throw error;
            }
            // Clear local storage data on sign out
            localStorage.removeItem('intake_data');
            localStorage.removeItem('plan_progress');
        } catch (error) {
            logger.error('[Auth] Sign out failed:', error);
            throw error;
        }
    };

    const value = {
        user,
        session,
        loading,
        isAuthenticated: !!session,
        signInWithGoogle: handleSignInWithGoogle,
        signOut: handleSignOut,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthContext;
