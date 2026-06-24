import { Router, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { ProductModel } from '../models/product.model';
import { OrderModel } from '../models/order.model';
import mongoose from 'mongoose';

const router = Router();

router.get('/products', authenticate, authorize('admin', 'superadmin'), async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      ProductModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ProductModel.countDocuments(),
    ]);

    res.json({
      success: true,
      data: products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    res.status(500).json({ message: 'Error al cargar productos' });
  }
});

router.post('/products', authenticate, authorize('admin', 'superadmin'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, category, prices, stock, badge, badgeType, icon } = req.body;

    if (!name || !description || !category) {
      res.status(400).json({ message: 'Nombre, descripción y categoría son requeridos' });
      return;
    }

    const product = await ProductModel.create({
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      prices: prices || [],
      stock: stock ?? 999,
      badge: badge || '',
      badgeType: badgeType || 'info',
      icon: icon || 'fas fa-box',
    });

    res.status(201).json({ success: true, data: product });
  } catch {
    res.status(500).json({ message: 'Error al crear producto' });
  }
});

router.get('/sales', authenticate, authorize('admin', 'superadmin'), async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      OrderModel.find()
        .populate('product', 'name category')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      OrderModel.countDocuments(),
    ]);

    const totalRevenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0);

    res.json({
      success: true,
      data: { orders, totalRevenue, totalOrders: total },
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    res.status(500).json({ message: 'Error al cargar ventas' });
  }
});

export default router;
