import { Router, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { ProductModel } from '../models/product.model';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo se permiten imágenes'));
  }
});

const router = Router();

router.get('/', async (_req, res: Response) => {
  const products = await ProductModel.find({ isActive: true }).sort({ createdAt: -1 });
  res.json({ success: true, data: products });
});

router.get('/all', authenticate, authorize('admin', 'vendedor'), async (_req: AuthRequest, res: Response) => {
  const products = await ProductModel.find().sort({ createdAt: -1 });
  res.json({ success: true, data: products });
});

router.post('/', authenticate, authorize('admin'), upload.single('imageFile'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, category, prices, stock, badge, badgeType, icon, image } = req.body;

    if (!name || !description || !category) {
      res.status(400).json({ message: 'Nombre, descripción y categoría son requeridos' });
      return;
    }

    let imageData = image || '';
    if (req.file) {
      imageData = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    const product = await ProductModel.create({
      name,
      description,
      category,
      prices: prices ? JSON.parse(prices) : [],
      stock: stock ?? 999,
      badge: badge || '',
      badgeType: badgeType || 'info',
      icon: icon || 'fas fa-box',
      image: imageData,
    });

    res.status(201).json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error al crear producto' });
  }
});

router.put('/:id', authenticate, authorize('admin', 'vendedor'), upload.single('imageFile'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, category, prices, stock, isActive, badge, badgeType, icon, image } = req.body;
    const update: any = {};

    if (name !== undefined) update.name = name;
    if (description !== undefined) update.description = description;
    if (category !== undefined) update.category = category;
    if (prices !== undefined) update.prices = JSON.parse(prices);
    if (stock !== undefined) update.stock = Number(stock);
    if (isActive !== undefined) update.isActive = isActive === 'true' || isActive === true;
    if (badge !== undefined) update.badge = badge;
    if (badgeType !== undefined) update.badgeType = badgeType;
    if (icon !== undefined) update.icon = icon;

    if (req.file) {
      update.image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    } else if (image !== undefined) {
      update.image = image;
    }

    const product = await ProductModel.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!product) {
      res.status(404).json({ message: 'Producto no encontrado' });
      return;
    }

    res.json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error al actualizar producto' });
  }
});

router.delete('/:id', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  const product = await ProductModel.findByIdAndDelete(req.params.id);
  if (!product) {
    res.status(404).json({ message: 'Producto no encontrado' });
    return;
  }
  res.json({ success: true, message: 'Producto eliminado' });
});

export default router;
