"use server";

import webpush from "web-push";

// VAPID 설정
webpush.setVapidDetails(
  "mailto:your-email@example.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

let subscription: webpush.PushSubscription | null = null; // ✅ web-push 타입을 명확히 지정

export async function subscribeUser(sub: PushSubscription) {
  // ✅ 웹 푸시에서 요구하는 타입 변환
  subscription = {
    endpoint: sub.endpoint,
    keys: {
      p256dh: (sub as any).keys?.p256dh || "",
      auth: (sub as any).keys?.auth || "",
    },
  };

  return { success: true };
}

export async function sendNotification(message: string) {
  if (!subscription) throw new Error("No subscription available");

  await webpush.sendNotification(
    subscription,
    JSON.stringify({
      title: "New Notification",
      body: message,
      icon: "/icon-192x192.png",
    })
  );
}
