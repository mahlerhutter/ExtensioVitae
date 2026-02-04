import React, { useState, useEffect } from 'react';
import { getNotificationHistory, markNotificationOpened } from '../../lib/notificationService';

/**
 * Notification History Component
 *
 * Displays list of sent/received notifications.
 */
export default function NotificationHistory({ userId, language = 'de', limit = 20 }) {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadHistory();
  }, [userId]);

  const loadHistory = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const data = await getNotificationHistory(userId, limit);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notification history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (notification.status === 'sent') {
      await markNotificationOpened(notification.id);
      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, status: 'opened' } : n)
      );
    }

    // Navigate to action URL if present
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;

    // Less than 1 hour
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return language === 'de' ? `vor ${minutes} Min` : `${minutes}m ago`;
    }

    // Less than 24 hours
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return language === 'de' ? `vor ${hours} Std` : `${hours}h ago`;
    }

    // Less than 7 days
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      return language === 'de' ? `vor ${days} Tag${days > 1 ? 'en' : ''}` : `${days}d ago`;
    }

    // Otherwise, show date
    return date.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
      day: 'numeric',
      month: 'short'
    });
  };

  const getTypeIcon = (type) => {
    const icons = {
      task_reminder: '⏰',
      streak_warning: '🔥',
      streak_milestone: '⭐',
      weekly_summary: '📊',
      blood_check_due: '🩸',
      achievement: '🏆',
      module_reminder: '📋'
    };
    return icons[type] || '📬';
  };

  const getTypeColor = (type) => {
    const colors = {
      task_reminder: 'bg-blue-500/20 text-blue-400',
      streak_warning: 'bg-orange-500/20 text-orange-400',
      streak_milestone: 'bg-amber-500/20 text-amber-400',
      weekly_summary: 'bg-purple-500/20 text-purple-400',
      blood_check_due: 'bg-red-500/20 text-red-400',
      achievement: 'bg-green-500/20 text-green-400',
      module_reminder: 'bg-cyan-500/20 text-cyan-400'
    };
    return colors[type] || 'bg-slate-500/20 text-slate-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">📭</div>
        <p className="text-slate-400">
          {language === 'de' ? 'Keine Benachrichtigungen' : 'No notifications'}
        </p>
      </div>
    );
  }

  // Group by date
  const grouped = groupByDate(notifications, language);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white">
        {language === 'de' ? 'Verlauf' : 'History'}
      </h3>

      {Object.entries(grouped).map(([date, items]) => (
        <div key={date}>
          {/* Date header */}
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-2 px-1">
            {date}
          </div>

          {/* Notifications for this date */}
          <div className="space-y-2">
            {items.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  notification.status === 'sent'
                    ? 'bg-slate-800 border-amber-500/30 hover:border-amber-500'
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${getTypeColor(notification.type)}`}>
                    {getTypeIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`font-medium truncate ${
                        notification.status === 'sent' ? 'text-white' : 'text-slate-300'
                      }`}>
                        {language === 'de' ? notification.title_de : (notification.title_en || notification.title_de)}
                      </h4>
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {formatTime(notification.sent_at)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mt-0.5 line-clamp-2">
                      {language === 'de' ? notification.body_de : (notification.body_en || notification.body_de)}
                    </p>
                  </div>

                  {/* Unread indicator */}
                  {notification.status === 'sent' && (
                    <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 mt-2" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Group notifications by date
function groupByDate(notifications, language) {
  const groups = {};
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

  for (const notification of notifications) {
    const date = new Date(notification.sent_at).toDateString();

    let label;
    if (date === today) {
      label = language === 'de' ? 'Heute' : 'Today';
    } else if (date === yesterday) {
      label = language === 'de' ? 'Gestern' : 'Yesterday';
    } else {
      const d = new Date(notification.sent_at);
      label = d.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'short'
      });
    }

    if (!groups[label]) {
      groups[label] = [];
    }
    groups[label].push(notification);
  }

  return groups;
}
