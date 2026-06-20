import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { MessageModel, ConversationModel } from '../models/message.model';
import { UserModel } from '../models/user.model';
import { NotificationModel } from '../models/notification.model';

const router = Router();

// Get all conversations for current user
router.get('/conversations', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const conversations = await ConversationModel.find({
      members: userId,
      isActive: true
    }).sort({ updatedAt: -1 });

    const enriched = await Promise.all(conversations.map(async (conv) => {
      const lastMsg = await MessageModel.findOne({ conversation: conv._id })
        .sort({ createdAt: -1 })
        .populate('sender', 'name email role');

      const memberDetails = await Promise.all(
        conv.members.map(id => UserModel.findById(id).select('name email role'))
      );

      return {
        ...conv.toObject(),
        lastMessage: lastMsg || null,
        memberDetails: memberDetails.filter(Boolean)
      };
    }));

    res.json({ success: true, data: enriched });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error al cargar conversaciones' });
  }
});

// Create or get a direct conversation
router.post('/conversations', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { participantId } = req.body;
    const userId = req.userId!;

    if (!participantId) {
      res.status(400).json({ message: 'ParticipantId requerido' });
      return;
    }

    // Check if direct conversation already exists
    const existing = await ConversationModel.findOne({
      type: 'direct',
      members: { $all: [userId, participantId] }
    });

    if (existing) {
      res.json({ success: true, data: existing });
      return;
    }

    const participant = await UserModel.findById(participantId).select('name');
    const user = await UserModel.findById(userId).select('name');

    const conversation = await ConversationModel.create({
      name: `${user?.name || 'Usuario'} & ${participant?.name || 'Usuario'}`,
      type: 'direct',
      members: [userId, participantId],
    });

    res.status(201).json({ success: true, data: conversation });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error al crear conversación' });
  }
});

// Get messages for a conversation
router.get('/conversations/:id/messages', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const convId = req.params.id as string;
    const messages = await MessageModel.find({ conversation: convId })
      .sort({ createdAt: 1 })
      .populate('sender', 'name email role');

    res.json({ success: true, data: messages });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error al cargar mensajes' });
  }
});

// Send a message
router.post('/conversations/:id/messages', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { content, type } = req.body;
    const userId = req.userId!;

    if (!content || !content.trim()) {
      res.status(400).json({ message: 'El contenido del mensaje es requerido' });
      return;
    }

    const convId = req.params.id as string;

    const message = await MessageModel.create({
      sender: new mongoose.Types.ObjectId(userId),
      content: content.trim(),
      type: type || 'text',
      conversation: new mongoose.Types.ObjectId(convId),
      readBy: [userId],
    });

    const populated = await MessageModel.findById(message._id).populate('sender', 'name email role');

    await ConversationModel.findByIdAndUpdate(convId, { updatedAt: new Date() });

    res.status(201).json({ success: true, data: populated });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error al enviar mensaje' });
  }
});

// Mark messages as read
router.put('/conversations/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const convId = req.params.id as string;
    await MessageModel.updateMany(
      { conversation: convId, readBy: { $ne: userId } },
      { $push: { readBy: userId } }
    );
    res.json({ success: true, message: 'Mensajes marcados como leídos' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error' });
  }
});

// Get all users (for starting new conversations)
router.get('/users', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    const users = await UserModel.find({ isActive: true }).select('name email role');
    res.json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error' });
  }
});

// ============ NOTIFICATIONS ============

// Get notifications for current user (by role)
router.get('/notifications', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await UserModel.findById(req.userId!).select('role');
    const role = user?.role || 'cliente';

    const notifications = await NotificationModel.find({
      $or: [
        { user: req.userId },
        { targetRole: role },
        { targetRole: '' },
      ]
    }).sort({ createdAt: -1 }).limit(50);

    res.json({ success: true, data: notifications });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error' });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const notifId = req.params.id as string;
    await NotificationModel.findByIdAndUpdate(notifId, { isRead: true });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error' });
  }
});

// Mark all notifications as read
router.put('/notifications/read-all', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await NotificationModel.updateMany(
      { user: req.userId, isRead: false },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error' });
  }
});

export default router;
