import { Router, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { OrderModel, OrderStatus } from '../models/order.model';

const router = Router();

router.get('/orders', authenticate, authorize('admin', 'superadmin', 'cliente'), async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      OrderModel.find({ buyer: req.userId })
        .populate('product', 'name category')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      OrderModel.countDocuments({ buyer: req.userId }),
    ]);

    res.json({
      success: true,
      data: orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    res.status(500).json({ message: 'Error al cargar órdenes' });
  }
});

router.get('/purchases', authenticate, authorize('admin', 'superadmin', 'cliente'), async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      OrderModel.find({ buyer: req.userId, status: { $ne: OrderStatus.CANCELLED } })
        .populate('product', 'name category')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      OrderModel.countDocuments({ buyer: req.userId, status: { $ne: OrderStatus.CANCELLED } }),
    ]);

    const totalSpent = orders.reduce((sum, o) => sum + (o.amount || 0), 0);

    res.json({
      success: true,
      data: { purchases: orders, totalSpent, total },
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    res.status(500).json({ message: 'Error al cargar compras' });
  }
});

export default router;
