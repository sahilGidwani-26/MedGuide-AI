// src/hooks/useMedicineNotifications.js
import { useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

export const useMedicineNotifications = () => {
  const swRef = useRef(null);

  // Register Service Worker on mount
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => { swRef.current = reg; })
      .catch((err) => console.error('[SW] registration failed:', err));
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      toast.error('Browser notifications support nahi karta');
      return false;
    }
    if (Notification.permission === 'granted') return true;
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      toast.success('Notifications enable ho gayi! 🔔');
      return true;
    }
    toast.error('Notifications blocked hai. Browser settings check karein.');
    return false;
  }, []);

  // Schedule today's upcoming reminders via SW or fallback setTimeout
  const scheduleReminders = useCallback((reminders = []) => {
    const now   = new Date();
    const today = now.toDateString();

    reminders.forEach((reminder) => {
      if (!reminder.isActive || !reminder.notificationsEnabled) return;
      if (reminder.startDate && new Date(reminder.startDate) > now) return;
      if (reminder.endDate   && new Date(reminder.endDate)   < now) return;

      (reminder.times || []).forEach((timeStr) => {
        const [h, m]         = timeStr.split(':').map(Number);
        const scheduledDate  = new Date(today);
        scheduledDate.setHours(h, m, 0, 0);
        const delayMs = scheduledDate.getTime() - now.getTime();
        if (delayMs < 0) return;

        if (swRef.current?.active) {
          swRef.current.active.postMessage({
            type:          'SCHEDULE_REMINDER',
            reminderId:    reminder._id,
            medicineName:  reminder.medicineName,
            dosage:        reminder.dosage || '',
            scheduledTime: scheduledDate.toISOString(),
            delayMs,
          });
        } else {
          // Fallback — works only while tab is open
          setTimeout(() => {
            if (Notification.permission === 'granted') {
              new Notification('💊 Medicine Reminder — MedGuide', {
                body: `${reminder.medicineName}${reminder.dosage ? ' · ' + reminder.dosage : ''} lene ka waqt ho gaya!`,
                icon: '/logo192.png',
                tag:  `reminder-${reminder._id}`,
                requireInteraction: true,
              });
            } else {
              toast(`💊 ${reminder.medicineName} lene ka waqt ho gaya!`, { duration: 10000 });
            }
          }, delayMs);
        }
      });
    });
  }, []);

  const testNotification = useCallback(async (medicineName) => {
    const granted = await requestPermission();
    if (!granted) return;
    new Notification('💊 Test — MedGuide', {
      body: `${medicineName} — Test notification ✅`,
      icon: '/logo192.png',
    });
  }, [requestPermission]);

  return {
    requestPermission,
    scheduleReminders,
    testNotification,
    permissionStatus: typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
  };
};

export default useMedicineNotifications;