import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleAppointmentReminder(
  reminderId: string,
  title: string,
  body: string,
  scheduledAt: Date
): Promise<string | null> {
  const ok = await ensureNotificationPermissions();
  if (!ok) return null;

  const trigger =
    scheduledAt.getTime() <= Date.now()
      ? null
      : { type: Notifications.SchedulableTriggerInputTypes.DATE as const, date: scheduledAt };

  if (!trigger) return null;

  return Notifications.scheduleNotificationAsync({
    identifier: reminderId,
    content: { title, body, sound: true },
    trigger,
  });
}

export async function cancelAppointmentReminder(reminderId: string) {
  await Notifications.cancelScheduledNotificationAsync(reminderId);
}
