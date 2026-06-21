import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { ProductModel } from '../models/product.model';
import { UserModel } from '../models/user.model';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const imagesDir = path.join(__dirname, '../../public/images');
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, imagesDir),
  filename: (_req, file, cb) => {
    const unique = crypto.randomUUID();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, unique + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_MIMES.includes(file.mimetype) && ALLOWED_EXTS.includes(ext)) cb(null, true);
    else cb(new Error('Solo se permiten imágenes (JPEG, PNG, GIF, WebP)'));
  }
});

const router = Router();

router.get('/', async (_req, res: Response) => {
  try {
    await ProductModel.updateMany({ image: { $regex: /^data:image/ } }, { $set: { image: '' } });
    const products = await ProductModel.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: products });
  } catch {
    res.status(500).json({ message: 'Error al cargar productos' });
  }
});

router.get('/all', authenticate, authorize('admin', 'vendedor'), async (req: AuthRequest, res: Response) => {
  try {
    await ProductModel.updateMany({ image: { $regex: /^data:image/ } }, { $set: { image: '' } });
    const products = await ProductModel.find().sort({ createdAt: -1 });
    res.json({ success: true, data: products });
  } catch {
    res.status(500).json({ message: 'Error al cargar productos' });
  }
});

router.post('/', authenticate, authorize('admin'), upload.single('imageFile'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, category, prices, stock, badge, badgeType, icon, image } = req.body;

    if (!name || !description || !category) {
      res.status(400).json({ message: 'Nombre, descripción y categoría son requeridos' });
      return;
    }

    if (name.length > 100 || description.length > 2000) {
      res.status(400).json({ message: 'Nombre o descripción demasiado largos' });
      return;
    }

    let imagePath = image || '';
    if (req.file) {
      imagePath = '/images/' + req.file.filename;
    }

    let parsedPrices: any[] = [];
    if (prices) {
      try { parsedPrices = JSON.parse(prices); } catch {
        res.status(400).json({ message: 'Formato de precios inválido' });
        return;
      }
    }

    const product = await ProductModel.create({
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      prices: parsedPrices,
      stock: stock ?? 999,
      badge: badge || '',
      badgeType: badgeType || 'info',
      icon: icon || 'fas fa-box',
      image: imagePath,
    });

    res.status(201).json({ success: true, data: product });
  } catch {
    res.status(500).json({ message: 'Error al crear producto' });
  }
});

router.put('/:id', authenticate, authorize('admin'), upload.single('imageFile'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'ID de producto inválido' });
      return;
    }

    const { name, description, category, prices, stock, isActive, badge, badgeType, icon, image } = req.body;
    const update: any = {};

    if (name !== undefined) update.name = String(name).trim();
    if (description !== undefined) update.description = String(description).trim();
    if (category !== undefined) update.category = String(category).trim();
    if (prices !== undefined) {
      try { update.prices = JSON.parse(prices); } catch {
        res.status(400).json({ message: 'Formato de precios inválido' });
        return;
      }
    }
    if (stock !== undefined) update.stock = Number(stock);
    if (isActive !== undefined) update.isActive = isActive === 'true' || isActive === true;
    if (badge !== undefined) update.badge = badge;
    if (badgeType !== undefined) update.badgeType = badgeType;
    if (icon !== undefined) update.icon = icon;

    if (req.file) {
      update.image = '/images/' + req.file.filename;
    } else if (image !== undefined && image !== '') {
      update.image = image;
    }

    const product = await ProductModel.findByIdAndUpdate(id, update, { new: true });
    if (!product) {
      res.status(404).json({ message: 'Producto no encontrado' });
      return;
    }

    res.json({ success: true, data: product });
  } catch {
    res.status(500).json({ message: 'Error al actualizar producto' });
  }
});

router.delete('/:id', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const product = await ProductModel.findByIdAndDelete(req.params.id);
    if (!product) {
      res.status(404).json({ message: 'Producto no encontrado' });
      return;
    }
    res.json({ success: true, message: 'Producto eliminado' });
  } catch {
    res.status(500).json({ message: 'Error al eliminar producto' });
  }
});

router.post('/fix-images', authenticate, authorize('admin'), async (_req: AuthRequest, res: Response) => {
  try {
    const result = await ProductModel.updateMany(
      { image: { $regex: /^data:image/ } },
      { $set: { image: '' } }
    );
    res.json({ success: true, message: `Corregidos ${result.modifiedCount} productos`, data: { modified: result.modifiedCount } });
  } catch {
    res.status(500).json({ message: 'Error al corregir imágenes' });
  }
});

export default router;
