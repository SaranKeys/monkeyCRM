import webpush from 'web-push';
import prisma from '../config/prisma.js';

webpush.setVapidDetails(
    'mailto:saranjeet@promonkey.tech', 
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

export const saveSubscription = async (userId, subscription) => {
    return await prisma.pushSubscription.create({
        data: {
            userId,
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth
        }
    });
};

export const sendNotificationToUser = async (userId, payload) => {
    const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId }
    });

    if (!subscriptions.length) return;

    const sendPromises = subscriptions.map(async (sub) => {
        const pushConfig = {
            endpoint: sub.endpoint,
            keys: { auth: sub.auth, p256dh: sub.p256dh }
        };

        try {
            await webpush.sendNotification(pushConfig, JSON.stringify(payload));
        } catch (error) {
            if (error.statusCode === 410 || error.statusCode === 404) {
                await prisma.pushSubscription.delete({ where: { id: sub.id } });
            }
        }
    });

    await Promise.all(sendPromises);
};