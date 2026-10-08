import { Router } from 'express';
import { ObjectId } from 'mongodb';
import {
  notificationsCollection,
  publicNotification,
} from '../models/notification.ts';
import { requireSession } from '../middleware/requireSession.ts';

const notificationRouter = Router();

notificationRouter.use(requireSession);

// Get current user's notifications (newest first, limit 50)
notificationRouter.get('/', async (_request, response) => {
  const userId = response.locals.userId as ObjectId;

  const records = await notificationsCollection
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  const unreadCount = await notificationsCollection.countDocuments({
    userId,
    isRead: false,
  });

  response.json({
    success: true,
    unreadCount,
    notifications: records.map(publicNotification),
  });
});

// Get unread notification count
notificationRouter.get('/unread-count', async (_request, response) => {
  const userId = response.locals.userId as ObjectId;

  const count = await notificationsCollection.countDocuments({
    userId,
    isRead: false,
  });

  response.json({
    success: true,
    unreadCount: count,
  });
});

// Mark single notification as read
notificationRouter.patch('/:notificationId/read', async (request, response) => {
  const userId = response.locals.userId as ObjectId;
  const notifIdStr = String(request.params.notificationId);

  if (!/^[a-f0-9]{24}$/i.test(notifIdStr)) {
    response.status(400).json({ success: false, message: 'Invalid notification ID.' });
    return;
  }

  await notificationsCollection.updateOne(
    { _id: new ObjectId(notifIdStr), userId },
    { $set: { isRead: true } },
  );

  response.json({ success: true });
});

// Mark all notifications as read for current user
notificationRouter.post('/read-all', async (_request, response) => {
  const userId = response.locals.userId as ObjectId;

  await notificationsCollection.updateMany(
    { userId, isRead: false },
    { $set: { isRead: true } },
  );

  response.json({ success: true });
});

export default notificationRouter;
