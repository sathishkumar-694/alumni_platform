import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../services/api';

const HEARTBEAT_INTERVAL = 30000; // 30 seconds

/**
 * usePresence — sends heartbeat while user is on page,
 * and provides a function to check if another user is online.
 */
export function usePresence(isLoggedIn) {
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isLoggedIn) return;

    const sendHeartbeat = () => {
      apiClient('/presence/heartbeat', { method: 'POST' }).catch(() => {});
    };

    sendHeartbeat(); // immediate
    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    // Also send on visibility change (tab regain focus)
    const handleVisibility = () => {
      if (!document.hidden) sendHeartbeat();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isLoggedIn]);
}

/**
 * useUserOnlineStatus — polls whether a given user ID is online.
 * Returns { online: bool, lastSeen: Date|null, loading: bool }
 */
export function useUserOnlineStatus(userId, pollIntervalMs = 20000) {
  const [status, setStatus] = useState({ online: false, lastSeen: null, loading: true });

  useEffect(() => {
    if (!userId) return;

    const check = async () => {
      try {
        const res = await apiClient(`/presence/${userId}`);
        setStatus({
          online: res.data?.online || false,
          lastSeen: res.data?.last_seen ? new Date(res.data.last_seen) : null,
          loading: false
        });
      } catch {
        setStatus(prev => ({ ...prev, loading: false }));
      }
    };

    check();
    const interval = setInterval(check, pollIntervalMs);
    return () => clearInterval(interval);
  }, [userId, pollIntervalMs]);

  return status;
}

/**
 * useBatchOnlineStatus — polls online status for multiple user IDs.
 * Returns { [userId]: { online, lastSeen } }
 */
export function useBatchOnlineStatus(userIds = [], pollIntervalMs = 20000) {
  const [statuses, setStatuses] = useState({});

  useEffect(() => {
    if (!userIds.length) return;

    const check = async () => {
      try {
        const ids = userIds.join(',');
        const res = await apiClient(`/presence?ids=${ids}`);
        setStatuses(res.data || {});
      } catch {
        // Fail silently
      }
    };

    check();
    const interval = setInterval(check, pollIntervalMs);
    return () => clearInterval(interval);
  }, [userIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  return statuses;
}
