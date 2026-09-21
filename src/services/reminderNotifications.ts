export async function scheduleReminderNotification() {
  console.log('Notifications disabled while running in Expo Go.');
  return null;
}

export async function scheduleAppointmentReminder(
  _id?: string,
  _title?: string,
  _body?: string,
  _date?: Date
) {
  console.log('Notifications disabled while running in Expo Go.');
  return null;
}

export async function cancelReminderNotification() {
  console.log('Notifications disabled while running in Expo Go.');
}

export async function cancelAppointmentReminder(_id?: string) {
  console.log('Notifications disabled while running in Expo Go.');
}

export async function requestNotificationPermissions() {
  console.log('Notifications disabled while running in Expo Go.');
  return false;
}