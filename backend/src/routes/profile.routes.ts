import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { UserModel } from '../models/user.model';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

const router = Router();

// GET own profile
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await UserModel.findById(req.userId).select('-password');
    if (!user) { res.status(404).json({ message: 'Usuario no encontrado' }); return; }
    res.json({ success: true, data: user });
  } catch {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// GET public profile by id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await UserModel.findById(req.params.id).select('-password -email');
    if (!user) { res.status(404).json({ message: 'Usuario no encontrado' }); return; }
    res.json({ success: true, data: user });
  } catch {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// PUT update own profile
router.put('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, bio, discord, country, phone } = req.body;
    const update: any = {};

    if (name !== undefined) update.name = name.trim();
    if (bio !== undefined) update.bio = bio.trim();
    if (discord !== undefined) update.discord = discord.trim();
    if (country !== undefined) update.country = country.trim();
    if (phone !== undefined) update.phone = phone.trim();

    const user = await UserModel.findByIdAndUpdate(req.userId, update, { new: true }).select('-password');
    if (!user) { res.status(404).json({ message: 'Usuario no encontrado' }); return; }

    res.json({ success: true, data: user });
  } catch {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// POST upload avatar
router.post('/avatar', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.files || !req.files.avatar) {
      res.status(400).json({ message: 'Archivo requerido' });
      return;
    }

    const file = req.files.avatar as any;
    const ext = path.extname(file.name).toLowerCase();
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const mimetypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (!allowed.includes(ext) || !mimetypes.includes(file.mimetype)) {
      res.status(400).json({ message: 'Solo se permiten imágenes (jpg, png, gif, webp)' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      res.status(400).json({ message: 'Máximo 2MB' });
      return;
    }

    const filename = `avatar-${crypto.randomUUID()}${ext}`;
    const uploadDir = path.join(__dirname, '../../public/images/avatars');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    await file.mv(path.join(uploadDir, filename));

    const avatarUrl = `/images/avatars/${filename}`;

    // Delete old avatar file if exists
    const currentUser = await UserModel.findById(req.userId).select('avatar');
    if (currentUser?.avatar) {
      const oldPath = path.join(__dirname, '../../public', currentUser.avatar);
      if (fs.existsSync(oldPath) && currentUser.avatar.startsWith('/images/avatars/avatar-')) {
        fs.unlinkSync(oldPath);
      }
    }

    await UserModel.findByIdAndUpdate(req.userId, { avatar: avatarUrl });

    res.json({ success: true, data: { avatar: avatarUrl } });
  } catch {
    res.status(500).json({ message: 'Error al subir avatar' });
  }
});

export default router;
