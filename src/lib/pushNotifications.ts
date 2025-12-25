import { backend } from "@/services";

const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDThPP7-rwIV88U4V2K4S8JEYYOGnYYNQTbVMcKlxFLA';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.error('This browser does not support notifications');
    return false;
  }

  if (!('serviceWorker' in navigator)) {
    console.error('This browser does not support service workers');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export async function subscribeToPushNotifications(walletAddress: string): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource
    });

    const subscriptionJson = subscription.toJSON();
    const { error } = await backend.pushSubscriptions.upsert({
      wallet_address: walletAddress,
      endpoint: subscriptionJson.endpoint!,
      p256dh: subscriptionJson.keys!.p256dh,
      auth: subscriptionJson.keys!.auth,
    });

    if (error) {
      console.error('Error saving subscription:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return false;
  }
}

export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const subscriptionJson = subscription.toJSON();
      
      const { error } = await backend.pushSubscriptions.deleteByEndpoint(subscriptionJson.endpoint!);

      if (error) {
        console.error('Error removing subscription:', error);
      }

      await subscription.unsubscribe();
    }

    return true;
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return false;
  }
}

export async function checkNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  return Notification.permission === 'granted';
}

export async function isSubscribed(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
}