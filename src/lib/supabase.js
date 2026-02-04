import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  logger.warn('Supabase credentials not configured. Using mock data.');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper functions for common operations
export async function getPlan(planId) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('id', planId)
    .single();

  if (error) {
    logger.error('Error fetching plan:', error);
    return null;
  }

  return data;
}

export async function getProgress(planId) {
  if (!supabase) return {};

  const { data, error } = await supabase
    .from('daily_progress')
    .select('*')
    .eq('plan_id', planId);

  if (error) {
    logger.error('Error fetching progress:', error);
    return {};
  }

  // Convert to object keyed by day number
  return data.reduce((acc, row) => {
    acc[row.day_number] = row.tasks_completed;
    return acc;
  }, {});
}

export async function updateTaskProgress(planId, dayNumber, taskId, completed) {
  if (!supabase) return;

  // First, get existing progress
  const { data: existing } = await supabase
    .from('daily_progress')
    .select('tasks_completed, total_tasks')
    .eq('plan_id', planId)
    .eq('day_number', dayNumber)
    .single();

  const tasksCompleted = existing?.tasks_completed || {};
  tasksCompleted[taskId] = completed;

  const completedCount = Object.values(tasksCompleted).filter(Boolean).length;

  // Upsert the progress record
  const { error } = await supabase
    .from('daily_progress')
    .upsert({
      plan_id: planId,
      day_number: dayNumber,
      tasks_completed: tasksCompleted,
      completed_tasks: completedCount,
      last_task_completed_at: completed ? new Date().toISOString() : null,
    }, {
      onConflict: 'plan_id,day_number',
    });

  if (error) {
    logger.error('Error updating progress:', error);
    throw error;
  }
}

export async function submitIntake(intakeData) {
  const webhookUrl = import.meta.env.VITE_MAKE_WEBHOOK_URL;

  if (!webhookUrl) {
    logger.warn('Make.com webhook not configured. Simulating submission.');
    return { success: true, plan_id: 'mock-plan-id' };
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...intakeData,
      submitted_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error('Intake submission failed');
  }

  return response.json();
}

// ============================================
// Authentication Functions
// ============================================

/**
 * Sign in with Google OAuth
 * Redirects to Google login and back to the app
 */
export async function signInWithGoogle() {
  if (!supabase) {
    logger.warn('Supabase not configured. Cannot sign in with Google.');
    return { error: new Error('Supabase not configured') };
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth`,
    },
  });

  if (error) {
    logger.error('[Auth] Google OAuth error:', error);
  }

  return { data, error };
}

/**
 * Sign out the current user
 */
export async function signOut() {
  if (!supabase) {
    logger.warn('Supabase not configured. Cannot sign out.');
    return { error: null };
  }

  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Get the current session
 */
export async function getSession() {
  if (!supabase) {
    return { session: null, error: null };
  }

  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
}

/**
 * Get the current user
 */
export async function getCurrentUser() {
  if (!supabase) {
    return { user: null, error: null };
  }

  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}

/**
 * Subscribe to auth state changes
 * @param {Function} callback - Called with (event, session) on auth changes
 * @returns {Function} Unsubscribe function
 */
export function onAuthStateChange(callback) {
  if (!supabase) {
    return () => { };
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return () => subscription.unsubscribe();
}

/**
 * Check if Supabase auth is available
 */
export function isAuthAvailable() {
  return supabase !== null;
}

// ============================================
// Data Storage Functions
// ============================================

/**
 * Save intake data to Supabase
 * @param {Object} intakeData - The intake form data
 * @param {string} userId - The authenticated user's ID
 */
export async function saveIntakeToSupabase(intakeData, userId) {
  if (!supabase || !userId) {
    logger.info('[Supabase] Not available, using localStorage only');
    return null;
  }

  const { data, error } = await supabase
    .from('intake_responses')
    .upsert({
      user_id: userId,
      name: intakeData.name,
      age: intakeData.age,
      sex: intakeData.sex,
      primary_goal: intakeData.primary_goal,
      sleep_hours_bucket: intakeData.sleep_hours_bucket,
      stress_1_10: intakeData.stress_1_10,
      training_frequency: intakeData.training_frequency,
      diet_pattern: intakeData.diet_pattern || [],
      height_cm: intakeData.height_cm,
      weight_kg: intakeData.weight_kg,
      daily_time_budget: intakeData.daily_time_budget,
      equipment_access: intakeData.equipment_access,
      submitted_at: intakeData.submitted_at || new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    })
    .select()
    .single();

  if (error) {
    logger.error('[Supabase] Error saving intake:', error);
    throw error;
  }

  logger.info('[Supabase] Intake saved:', data.id);
  return data;
}

/**
 * Get intake data from Supabase for a user
 * @param {string} userId - The authenticated user's ID
 */
export async function getIntakeFromSupabase(userId) {
  if (!supabase || !userId) return null;

  const { data, error } = await supabase
    .from('intake_responses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle(); // Use maybeSingle() to handle zero rows gracefully

  if (error) {
    logger.error('[Supabase] Error fetching intake:', error);
    logger.error('[Supabase] Error code:', error.code);
    logger.error('[Supabase] Error message:', error.message);
    logger.error('[Supabase] Error details:', error.details);
    return null;
  }

  return data;
}

/**
 * Save a generated plan to Supabase
 * @param {Object} plan - The generated plan object
 * @param {string} userId - The authenticated user's ID
 * @param {string} intakeId - The intake response ID (optional)
 */
export async function savePlanToSupabase(plan, userId, intakeId = null) {
  if (!supabase || !userId) {
    logger.info('[Supabase] Not available, using localStorage only');
    return null;
  }

  // Case 1: Updating an existing plan (has supabase_plan_id)
  if (plan.supabase_plan_id) {
    const { data, error } = await supabase
      .from('plans')
      .update({
        plan_summary: plan.plan_summary,
        primary_focus_pillars: plan.primary_focus_pillars,
        plan_data: plan,
        generation_method: plan.generation_method || 'algorithm',
        llm_provider: plan.llm_provider || null,
        user_name: plan.user_name, // Ensure user_name is updated
        updated_at: new Date().toISOString(),
      })
      .eq('id', plan.supabase_plan_id)
      .select()
      .single();

    if (error) {
      logger.error('[Supabase] Error updating plan:', error);
      throw error;
    }

    logger.info('[Supabase] Plan updated:', data.id);
    return data;
  }

  // Case 2: Creating a NEW plan (Archive old active plans first)
  // Archive any existing active plans for this user
  // Archive any existing active plans for this user
  const { error: archiveError } = await supabase
    .from('plans')
    .update({
      status: 'inactive',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('status', 'active');

  if (archiveError) {
    logger.error('[Supabase] Error archiving old plans:', archiveError);
    // Proceed anyway, but log it
  }

  // Helper to perform the insert
  const insertPlan = async (payload) => {
    return await supabase
      .from('plans')
      .insert(payload)
      .select()
      .single();
  };

  const payload = {
    user_id: userId,
    intake_id: intakeId,
    user_name: (plan.user_name || 'User').substring(0, 50),
    plan_summary: plan.plan_summary || 'Generated Plan',
    primary_focus_pillars: plan.primary_focus_pillars || [],
    plan_data: plan,
    generation_method: plan.generation_method || 'algorithm',
    llm_provider: plan.llm_provider || null,
    start_date: (plan.start_date || new Date().toISOString()).split('T')[0],
    status: 'active'
  };

  let result = await insertPlan(payload);

  // If failed with foreign key violation (intake_id not found), retry without it
  if (result.error && result.error.code === '23503') {
    logger.warn('[Supabase] Intake ID not found. Retrying without link...');
    payload.intake_id = null;
    result = await insertPlan(payload);
  }

  const { data, error } = result;

  if (error) {
    logger.error('[Supabase] CRITICAL Error creating plan:', error);
    logger.error('[Supabase] Error details:', error.details, error.hint, error.message);
    throw error;
  }

  logger.info('[Supabase] Plan created successfully (and previous set to inactive):', data.id);
  return data;
}

/**
 * Get the active plan for a user from Supabase
 * @param {string} userId - The authenticated user's ID
 */
export async function getActivePlanFromSupabase(userId) {
  if (!supabase || !userId) return null;

  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle(); // Use maybeSingle() to handle zero rows gracefully

  if (error) {
    logger.error('[Supabase] Error fetching plan:', error);
    return null;
  }

  // Return the plan_data JSONB as the plan, with id attached
  if (data) {
    // Handle potential double-nesting in plan_data
    let planData = data.plan_data;

    // If plan_data contains another plan_data, unwrap it
    if (planData && planData.plan_data) {
      logger.warn('[Supabase] Detected double-nested plan_data, unwrapping...');
      planData = planData.plan_data;
    }

    return {
      ...planData,
      supabase_plan_id: data.id,
      start_date: data.start_date,
    };
  }

  return null;
}

/**
 * Get archived/inactive plans for a user
 * @param {string} userId - The authenticated user's ID
 */
export async function getArchivedPlansFromSupabase(userId) {
  if (!supabase || !userId) return [];

  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['inactive', 'completed', 'cancelled', 'paused']) // Fetch all non-active plans
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] Error fetching archived plans:', error);
    return [];
  }

  return data.map(p => ({
    ...p.plan_data,
    supabase_plan_id: p.id,
    created_at: p.created_at,
    updated_at: p.updated_at,
    start_date: p.start_date,
    archived: true
  }));
}

/**
 * Get progress for a plan from Supabase
 * @param {string} planId - The Supabase plan ID
 */
export async function getProgressFromSupabase(planId) {
  if (!supabase || !planId) return {};

  const { data, error } = await supabase
    .from('daily_progress')
    .select('day_number, tasks_completed')
    .eq('plan_id', planId);

  if (error) {
    logger.error('[Supabase] Error fetching progress:', error);
    return {};
  }

  // Convert to object keyed by day number
  return data.reduce((acc, row) => {
    acc[row.day_number] = row.tasks_completed || {};
    return acc;
  }, {});
}

/**
 * Update task progress in Supabase
 * @param {string} planId - The Supabase plan ID
 * @param {string} userId - The authenticated user's ID
 * @param {number} dayNumber - The day number (1-30)
 * @param {string} taskId - The task ID
 * @param {boolean} completed - Whether the task is completed
 * @param {number} totalTasks - Total number of tasks for the day
 */
export async function updateProgressInSupabase(planId, userId, dayNumber, taskId, completed, totalTasks) {
  if (!supabase || !planId || !userId) return;

  // Get existing progress for this day
  const { data: existing } = await supabase
    .from('daily_progress')
    .select('id, tasks_completed')
    .eq('plan_id', planId)
    .eq('day_number', dayNumber)
    .single();

  const tasksCompleted = existing?.tasks_completed || {};
  tasksCompleted[taskId] = completed;

  const completedCount = Object.values(tasksCompleted).filter(Boolean).length;
  const now = new Date().toISOString();

  // Upsert the progress record
  const { error } = await supabase
    .from('daily_progress')
    .upsert({
      plan_id: planId,
      user_id: userId,
      day_number: dayNumber,
      tasks_completed: tasksCompleted,
      total_tasks: totalTasks,
      completed_tasks: completedCount,
      last_task_completed_at: completed ? now : existing?.last_task_completed_at,
      first_task_completed_at: existing?.first_task_completed_at || (completed ? now : null),
      all_tasks_completed_at: completedCount === totalTasks ? now : null,
    }, {
      onConflict: 'plan_id,day_number',
    });

  if (error) {
    logger.error('[Supabase] Error updating progress:', error);
    throw error;
  }

  logger.info(`[Supabase] Progress updated: Day ${dayNumber}, Task ${taskId} = ${completed}`);
}

/**
 * Get user profile from Supabase
 * @param {string} userId - The authenticated user's ID
 */
export async function getUserProfile(userId) {
  if (!supabase || !userId) return null;

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle(); // Use maybeSingle() to handle zero rows gracefully

  if (error) {
    logger.error('[Supabase] Error fetching profile:', error);
    return null;
  }

  return data;
}
