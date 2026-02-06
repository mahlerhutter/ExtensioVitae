# ExtensioVitae - Frontend Services

## Overview

Complete service layer for task management, recovery tracking, and wearable integration. All services use Supabase client and follow consistent error handling patterns.

---

## 1. Task Service

**File:** `src/services/taskService.js`

```javascript
import { supabase } from '../lib/supabaseClient'

/**
 * Task Management Service
 * Handles CRUD operations, completions, and streak tracking
 */

export const taskService = {
  /**
   * Get all active tasks for a user
   * @param {object} filters - Optional filters {category, isRecurring}
   * @returns {Promise<Array>} List of tasks
   */
  async getTasks(filters = {}) {
    try {
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('is_active', true)
        .order('current_streak', { ascending: false })

      if (filters.category) {
        query = query.eq('category', filters.category)
      }

      if (filters.isRecurring !== undefined) {
        query = query.eq('is_recurring', filters.isRecurring)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching tasks:', error)
      throw error
    }
  },

  /**
   * Get tasks adjusted for current recovery state
   * Uses stored procedure for performance
   * @param {string} date - YYYY-MM-DD (defaults to today)
   * @returns {Promise<Array>} Adjusted tasks with recommendations
   */
  async getAdjustedTasks(date = null) {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .rpc('get_adjusted_tasks', {
          p_user_id: (await supabase.auth.getUser()).data.user.id,
          p_date: targetDate
        })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error fetching adjusted tasks:', error)
      throw error
    }
  },

  /**
   * Create a new task
   * @param {object} taskData - Task properties
   * @returns {Promise<object>} Created task
   */
  async createTask(taskData) {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: taskData.title,
          description: taskData.description,
          category: taskData.category,
          base_difficulty: taskData.baseDifficulty || 5,
          duration_minutes: taskData.durationMinutes,
          intensity: taskData.intensity || 'medium',
          optimal_time_of_day: taskData.optimalTimeOfDay || null,
          is_recurring: taskData.isRecurring || false,
          recurrence_pattern: taskData.recurrencePattern || null
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating task:', error)
      throw error
    }
  },

  /**
   * Update an existing task
   * @param {string} taskId - UUID
   * @param {object} updates - Fields to update
   * @returns {Promise<object>} Updated task
   */
  async updateTask(taskId, updates) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating task:', error)
      throw error
    }
  },

  /**
   * Delete a task (soft delete - sets is_active = false)
   * @param {string} taskId - UUID
   * @returns {Promise<boolean>} Success status
   */
  async deleteTask(taskId) {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ is_active: false })
        .eq('id', taskId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting task:', error)
      throw error
    }
  },

  /**
   * Complete a task
   * Triggers streak recalculation via database trigger
   * @param {string} taskId - UUID
   * @param {object} completionData - Additional completion details
   * @returns {Promise<object>} Completion record + updated task
   */
  async completeTask(taskId, completionData = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Get current recovery score for context
      const today = new Date().toISOString().split('T')[0]
      const { data: recoveryData } = await supabase
        .from('recovery_metrics')
        .select('recovery_score')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()

      // Determine time of day
      const hour = new Date().getHours()
      let timeOfDay
      if (hour >= 6 && hour < 10) timeOfDay = 'morning'
      else if (hour >= 10 && hour < 14) timeOfDay = 'midday'
      else if (hour >= 14 && hour < 18) timeOfDay = 'afternoon'
      else if (hour >= 18 && hour < 22) timeOfDay = 'evening'
      else timeOfDay = 'night'

      // Insert completion record
      const { data: completion, error: completionError } = await supabase
        .from('task_completions')
        .insert({
          task_id: taskId,
          user_id: user.id,
          duration_actual_minutes: completionData.durationActualMinutes,
          perceived_difficulty: completionData.perceivedDifficulty,
          notes: completionData.notes,
          recovery_score_at_completion: recoveryData?.recovery_score,
          time_of_day: timeOfDay
        })
        .select()
        .single()

      if (completionError) throw completionError

      // Fetch updated task (streak will be updated by trigger)
      const { data: updatedTask, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single()

      if (taskError) throw taskError

      return {
        completion,
        task: updatedTask
      }
    } catch (error) {
      console.error('Error completing task:', error)
      throw error
    }
  },

  /**
   * Get task completion history
   * @param {string} taskId - UUID
   * @param {number} days - Number of days to look back (default 30)
   * @returns {Promise<Array>} Completion records
   */
  async getTaskHistory(taskId, days = 30) {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await supabase
        .from('task_completions')
        .select('*')
        .eq('task_id', taskId)
        .gte('completed_at', startDate.toISOString())
        .order('completed_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching task history:', error)
      throw error
    }
  },

  /**
   * Calculate completion rate for a task
   * @param {string} taskId - UUID
   * @param {number} days - Period to analyze (default 30)
   * @returns {Promise<number>} Completion rate (0-1)
   */
  async getCompletionRate(taskId, days = 30) {
    try {
      const history = await this.getTaskHistory(taskId, days)
      const completionDates = new Set(history.map(h =>
        new Date(h.completed_at).toISOString().split('T')[0]
      ))

      // For recurring tasks, calculate % of expected completions
      const { data: task } = await supabase
        .from('tasks')
        .select('is_recurring, recurrence_pattern')
        .eq('id', taskId)
        .single()

      if (!task?.is_recurring) {
        return history.length > 0 ? 1 : 0 // One-time task
      }

      // Calculate expected completions based on recurrence pattern
      let expectedDays = days
      if (task.recurrence_pattern?.type === 'weekly' && task.recurrence_pattern?.days) {
        const daysPerWeek = task.recurrence_pattern.days.length
        expectedDays = Math.floor(days / 7) * daysPerWeek
      }

      return Math.min(1, completionDates.size / expectedDays)
    } catch (error) {
      console.error('Error calculating completion rate:', error)
      return 0
    }
  },

  /**
   * Get streak breakdown (heatmap data)
   * @param {string} taskId - UUID
   * @param {number} days - Days to retrieve (default 90)
   * @returns {Promise<Array>} Array of {date, completed}
   */
  async getStreakHeatmap(taskId, days = 90) {
    try {
      const history = await this.getTaskHistory(taskId, days)
      const completionDates = new Set(history.map(h =>
        new Date(h.completed_at).toISOString().split('T')[0]
      ))

      const heatmap = []
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateString = date.toISOString().split('T')[0]

        heatmap.push({
          date: dateString,
          completed: completionDates.has(dateString)
        })
      }

      return heatmap
    } catch (error) {
      console.error('Error generating heatmap:', error)
      return []
    }
  },

  /**
   * Get next best action (top priority task)
   * Based on recovery state, time of day, and active streaks
   * @returns {Promise<object|null>} Next recommended task
   */
  async getNextBestAction() {
    try {
      const adjustedTasks = await this.getAdjustedTasks()

      if (!adjustedTasks || adjustedTasks.length === 0) {
        return null
      }

      // Prioritization logic:
      // 1. Active streaks (highest)
      // 2. Optimal for current time of day
      // 3. Category priority (exercise > cognitive > nutrition > recovery)
      const categoryPriority = {
        exercise: 4,
        cognitive: 3,
        nutrition: 2,
        recovery: 1,
        supplements: 1,
        social: 1,
        custom: 0
      }

      const scored = adjustedTasks.map(task => ({
        ...task,
        priority_score: (
          (task.current_streak > 0 ? 100 : 0) + // Active streak = +100
          (task.optimal_for_time ? 50 : 0) + // Right time = +50
          (categoryPriority[task.category] || 0) * 10 // Category = +0-40
        )
      }))

      scored.sort((a, b) => b.priority_score - a.priority_score)

      return scored[0]
    } catch (error) {
      console.error('Error getting next best action:', error)
      return null
    }
  },

  /**
   * Subscribe to task changes (real-time)
   * @param {Function} callback - Called when tasks change
   * @returns {object} Subscription object (call .unsubscribe() to stop)
   */
  subscribeToTasks(callback) {
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${supabase.auth.getUser().then(u => u.data.user.id)}`
        },
        (payload) => {
          callback(payload)
        }
      )
      .subscribe()

    return channel
  }
}
```

---

## 2. Recovery Service

**File:** `src/services/recoveryService.js`

```javascript
import { supabase } from '../lib/supabaseClient'

/**
 * Recovery Tracking Service
 * Handles HRV, sleep, and recovery score management
 */

export const recoveryService = {
  /**
   * Get today's recovery metrics
   * @returns {Promise<object|null>} Recovery data
   */
  async getTodayRecovery() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('recovery_metrics')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        throw error
      }

      return data || null
    } catch (error) {
      console.error('Error fetching today recovery:', error)
      throw error
    }
  },

  /**
   * Get recovery trend over time
   * @param {number} days - Number of days (default 30)
   * @returns {Promise<Array>} Time-series recovery data
   */
  async getRecoveryTrend(days = 30) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await supabase
        .from('recovery_metrics')
        .select('date, recovery_score, hrv_rmssd, sleep_score, rhr_bpm, readiness_state')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching recovery trend:', error)
      return []
    }
  },

  /**
   * Get user's recovery baseline (rolling averages)
   * @returns {Promise<object|null>} Baseline metrics
   */
  async getBaseline() {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { data, error } = await supabase
        .from('user_recovery_baseline')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data || null
    } catch (error) {
      console.error('Error fetching baseline:', error)
      return null
    }
  },

  /**
   * Manually log recovery data (fallback when no wearable)
   * @param {object} manualData - User-entered recovery metrics
   * @returns {Promise<object>} Created recovery metric
   */
  async manualLogRecovery(manualData) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const date = manualData.date || new Date().toISOString().split('T')[0]

      // Calculate a simple recovery score from manual inputs
      // (This is a simplified version - adjust based on available inputs)
      const sleepScore = Math.min(100, (manualData.sleepHours / 8) * 100)
      const stressScore = 100 - (manualData.stressLevel * 20) // 1-5 scale
      const energyScore = manualData.energyLevel * 20 // 1-5 scale

      const recoveryScore = Math.round((sleepScore + stressScore + energyScore) / 3)

      let readinessState = 'moderate'
      if (recoveryScore >= 70) readinessState = 'optimal'
      else if (recoveryScore < 50) readinessState = 'low'

      const { data, error } = await supabase
        .from('recovery_metrics')
        .upsert({
          user_id: user.id,
          date,
          sleep_total_minutes: Math.round(manualData.sleepHours * 60),
          recovery_score: recoveryScore,
          readiness_state: readinessState,
          data_source: 'manual',
          notes: manualData.notes
        }, {
          onConflict: 'user_id,date'
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error logging manual recovery:', error)
      throw error
    }
  },

  /**
   * Get actionable recovery insights
   * @returns {Promise<Array>} List of insights/recommendations
   */
  async getRecoveryInsights() {
    try {
      const todayRecovery = await this.getTodayRecovery()
      const baseline = await this.getBaseline()
      const trend = await this.getRecoveryTrend(7)

      const insights = []

      if (!todayRecovery) {
        insights.push({
          type: 'info',
          message: 'No recovery data yet. Connect a wearable or log manually.',
          action: 'connect_wearable'
        })
        return insights
      }

      // HRV Analysis
      if (baseline?.hrv_7day_avg && todayRecovery.hrv_rmssd) {
        const hrvChange = ((todayRecovery.hrv_rmssd / baseline.hrv_7day_avg) - 1) * 100

        if (hrvChange < -10) {
          insights.push({
            type: 'warning',
            metric: 'HRV',
            message: `Your HRV is ${Math.abs(hrvChange).toFixed(0)}% below your baseline. Consider active recovery today.`,
            recommendation: 'Replace high-intensity workouts with yoga or walking'
          })
        } else if (hrvChange > 10) {
          insights.push({
            type: 'positive',
            metric: 'HRV',
            message: `Your HRV is ${hrvChange.toFixed(0)}% above baseline! Your body is well-recovered.`,
            recommendation: 'Good day for challenging workouts or personal records'
          })
        }
      }

      // Sleep Analysis
      if (todayRecovery.sleep_total_minutes) {
        const sleepHours = todayRecovery.sleep_total_minutes / 60

        if (sleepHours < 7) {
          insights.push({
            type: 'warning',
            metric: 'Sleep',
            message: `Only ${sleepHours.toFixed(1)} hours of sleep. Sleep debt impacts recovery.`,
            recommendation: 'Prioritize an earlier bedtime tonight'
          })
        } else if (sleepHours >= 8) {
          insights.push({
            type: 'positive',
            metric: 'Sleep',
            message: `Great sleep: ${sleepHours.toFixed(1)} hours`,
            recommendation: null
          })
        }
      }

      // Trend Analysis (7-day)
      if (trend.length >= 7) {
        const recentScores = trend.slice(-7).map(d => d.recovery_score).filter(Boolean)
        const lowRecoveryDays = recentScores.filter(score => score < 50).length

        if (lowRecoveryDays >= 3) {
          insights.push({
            type: 'alert',
            metric: 'Trend',
            message: `${lowRecoveryDays} low recovery days in the past week. Risk of overtraining.`,
            recommendation: 'Schedule a full rest day within 2 days'
          })
        }
      }

      // Readiness State
      if (todayRecovery.readiness_state === 'low') {
        insights.push({
          type: 'info',
          metric: 'Readiness',
          message: 'Your body needs recovery. Focus on restoration today.',
          recommendation: 'Light movement, stretching, and stress management'
        })
      } else if (todayRecovery.readiness_state === 'optimal') {
        insights.push({
          type: 'positive',
          metric: 'Readiness',
          message: 'Optimal readiness! Your body is primed for performance.',
          recommendation: 'Ideal day for high-intensity or skill-focused training'
        })
      }

      return insights
    } catch (error) {
      console.error('Error generating insights:', error)
      return []
    }
  },

  /**
   * Subscribe to recovery metric changes (real-time)
   * @param {Function} callback - Called when recovery data updates
   * @returns {object} Subscription object
   */
  subscribeToRecovery(callback) {
    const channel = supabase
      .channel('recovery-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recovery_metrics'
        },
        (payload) => {
          callback(payload)
        }
      )
      .subscribe()

    return channel
  }
}
```

---

## 3. Wearable Service

**File:** `src/services/wearableService.js`

```javascript
import { supabase } from '../lib/supabaseClient'

/**
 * Wearable Integration Service
 * Handles OAuth, connections, and sync management
 */

export const wearableService = {
  /**
   * Get all wearable connections for current user
   * @returns {Promise<Array>} List of connections
   */
  async getConnections() {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { data, error } = await supabase
        .from('wearable_connections')
        .select('*')
        .eq('user_id', user.id)
        .order('is_primary', { ascending: false })
        .order('connected_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching connections:', error)
      return []
    }
  },

  /**
   * Get primary wearable device
   * @returns {Promise<object|null>} Primary connection
   */
  async getPrimaryDevice() {
    try {
      const connections = await this.getConnections()
      return connections.find(c => c.is_primary) || connections[0] || null
    } catch (error) {
      console.error('Error getting primary device:', error)
      return null
    }
  },

  /**
   * Initiate OAuth flow for wearable device
   * @param {string} deviceType - 'oura' | 'whoop' | 'apple_health'
   * @returns {Promise<string>} OAuth URL to redirect to
   */
  async initiateOAuthFlow(deviceType) {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Generate state parameter for CSRF protection
      const state = crypto.randomUUID()
      sessionStorage.setItem('oauth_state', state)
      sessionStorage.setItem('oauth_device_type', deviceType)

      const redirectUri = `${window.location.origin}/auth/callback`

      let oauthUrl

      switch (deviceType) {
        case 'oura':
          oauthUrl = `https://cloud.ouraring.com/oauth/authorize?` +
            `response_type=code&` +
            `client_id=${import.meta.env.VITE_OURA_CLIENT_ID}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `scope=email%20personal%20daily&` +
            `state=${state}`
          break

        case 'whoop':
          oauthUrl = `https://api.whoop.com/oauth/authorize?` +
            `response_type=code&` +
            `client_id=${import.meta.env.VITE_WHOOP_CLIENT_ID}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `scope=read:recovery%20read:sleep%20read:workout&` +
            `state=${state}`
          break

        case 'apple_health':
          // Apple Health requires native iOS integration
          // This would trigger a deep link to the iOS app
          throw new Error('Apple Health integration requires the mobile app')

        default:
          throw new Error(`Unsupported device type: ${deviceType}`)
      }

      return oauthUrl
    } catch (error) {
      console.error('Error initiating OAuth:', error)
      throw error
    }
  },

  /**
   * Handle OAuth callback (exchange code for tokens)
   * @param {string} code - Authorization code
   * @param {string} state - State parameter (CSRF check)
   * @returns {Promise<object>} Created connection
   */
  async handleOAuthCallback(code, state) {
    try {
      // Verify state (CSRF protection)
      const savedState = sessionStorage.getItem('oauth_state')
      if (state !== savedState) {
        throw new Error('Invalid state parameter - potential CSRF attack')
      }

      const deviceType = sessionStorage.getItem('oauth_device_type')
      sessionStorage.removeItem('oauth_state')
      sessionStorage.removeItem('oauth_device_type')

      // Call Edge Function to exchange code for tokens
      // (We don't expose client secrets in frontend)
      const { data, error } = await supabase.functions.invoke('oauth-callback', {
        body: {
          code,
          device_type: deviceType,
          redirect_uri: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error

      return data.connection
    } catch (error) {
      console.error('Error handling OAuth callback:', error)
      throw error
    }
  },

  /**
   * Disconnect a wearable device
   * @param {string} connectionId - UUID
   * @returns {Promise<boolean>} Success status
   */
  async disconnectDevice(connectionId) {
    try {
      // Update connection status to disconnected
      const { error } = await supabase
        .from('wearable_connections')
        .update({
          sync_status: 'disconnected',
          access_token: null,
          refresh_token: null
        })
        .eq('id', connectionId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error disconnecting device:', error)
      throw error
    }
  },

  /**
   * Get sync status for a connection
   * @param {string} connectionId - UUID
   * @returns {Promise<object>} Sync status details
   */
  async getSyncStatus(connectionId) {
    try {
      const { data, error } = await supabase
        .from('wearable_connections')
        .select('sync_status, last_sync_at, sync_error_message, sync_retry_count')
        .eq('id', connectionId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error getting sync status:', error)
      return null
    }
  },

  /**
   * Trigger manual sync for a connection
   * @param {string} connectionId - UUID
   * @returns {Promise<boolean>} Success status
   */
  async triggerManualSync(connectionId) {
    try {
      // Call Edge Function to manually trigger sync
      const { error } = await supabase.functions.invoke('manual-sync', {
        body: { connection_id: connectionId }
      })

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error triggering manual sync:', error)
      throw error
    }
  },

  /**
   * Set primary device
   * @param {string} connectionId - UUID
   * @returns {Promise<boolean>} Success status
   */
  async setPrimaryDevice(connectionId) {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Remove primary flag from all devices
      await supabase
        .from('wearable_connections')
        .update({ is_primary: false })
        .eq('user_id', user.id)

      // Set new primary
      const { error } = await supabase
        .from('wearable_connections')
        .update({ is_primary: true })
        .eq('id', connectionId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error setting primary device:', error)
      throw error
    }
  },

  /**
   * Get recent wearable data samples (for preview)
   * @param {string} connectionId - UUID
   * @param {number} limit - Number of samples (default 10)
   * @returns {Promise<Array>} Recent data samples
   */
  async getRecentData(connectionId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('wearable_data')
        .select('measurement_timestamp, data_type, data')
        .eq('connection_id', connectionId)
        .order('measurement_timestamp', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching recent data:', error)
      return []
    }
  },

  /**
   * Subscribe to connection changes (real-time)
   * @param {Function} callback - Called when connections change
   * @returns {object} Subscription object
   */
  subscribeToConnections(callback) {
    const channel = supabase
      .channel('connections-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wearable_connections'
        },
        (payload) => {
          callback(payload)
        }
      )
      .subscribe()

    return channel
  }
}
```

---

## 4. Error Handling Utility

**File:** `src/services/errorHandler.js`

```javascript
/**
 * Centralized error handling for services
 */

export class ServiceError extends Error {
  constructor(message, code, originalError = null) {
    super(message)
    this.name = 'ServiceError'
    this.code = code
    this.originalError = originalError
  }
}

export const handleServiceError = (error, context = '') => {
  console.error(`[${context}]`, error)

  // Supabase-specific errors
  if (error.code === 'PGRST116') {
    return new ServiceError('No data found', 'NOT_FOUND', error)
  }

  if (error.code === '23505') {
    return new ServiceError('Duplicate entry', 'DUPLICATE', error)
  }

  if (error.code === '42501') {
    return new ServiceError('Permission denied', 'FORBIDDEN', error)
  }

  // Network errors
  if (error.message?.includes('Failed to fetch')) {
    return new ServiceError('Network error - check your connection', 'NETWORK_ERROR', error)
  }

  // Generic fallback
  return new ServiceError(
    error.message || 'An unexpected error occurred',
    'UNKNOWN',
    error
  )
}

export const withErrorHandling = (serviceMethod, context) => {
  return async (...args) => {
    try {
      return await serviceMethod(...args)
    } catch (error) {
      throw handleServiceError(error, context)
    }
  }
}
```

---

## Usage Examples

### Task Management

```javascript
import { taskService } from './services/taskService'

// Get adjusted tasks for today
const tasks = await taskService.getAdjustedTasks()

// Complete a task
await taskService.completeTask('task-uuid', {
  durationActualMinutes: 30,
  perceivedDifficulty: 7,
  notes: 'Felt great!'
})

// Get next best action
const nextTask = await taskService.getNextBestAction()
```

### Recovery Tracking

```javascript
import { recoveryService } from './services/recoveryService'

// Get today's recovery
const recovery = await recoveryService.getTodayRecovery()

// Get insights
const insights = await recoveryService.getRecoveryInsights()

// Manual log (if no wearable)
await recoveryService.manualLogRecovery({
  sleepHours: 7.5,
  stressLevel: 2, // 1-5 scale
  energyLevel: 4, // 1-5 scale
  notes: 'Felt rested'
})
```

### Wearable Integration

```javascript
import { wearableService } from './services/wearableService'

// Start OAuth flow
const oauthUrl = await wearableService.initiateOAuthFlow('oura')
window.location.href = oauthUrl

// Get connections
const connections = await wearableService.getConnections()

// Disconnect device
await wearableService.disconnectDevice('connection-uuid')
```

---

## Testing

### Unit Tests (Jest)

```javascript
// taskService.test.js
import { taskService } from './taskService'

jest.mock('../lib/supabaseClient')

describe('taskService', () => {
  test('getTasks returns active tasks only', async () => {
    const tasks = await taskService.getTasks()
    expect(tasks.every(t => t.is_active === true)).toBe(true)
  })

  test('completeTask updates streak', async () => {
    const result = await taskService.completeTask('test-uuid')
    expect(result.task.current_streak).toBeGreaterThan(0)
  })
})
```

---

## Performance Optimization

### Caching Strategy

```javascript
// Simple in-memory cache with TTL
class ServiceCache {
  constructor(ttlSeconds = 300) {
    this.cache = new Map()
    this.ttl = ttlSeconds * 1000
  }

  get(key) {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.value
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    })
  }

  clear() {
    this.cache.clear()
  }
}

export const recoveryCache = new ServiceCache(300) // 5 minutes
```

