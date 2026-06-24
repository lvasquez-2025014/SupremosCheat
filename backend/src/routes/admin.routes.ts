import { Router, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { UserModel, UserRole } from '../models/user.model';
import { ProductModel } from '../models/product.model';
import { MessageModel, ConversationModel } from '../models/message.model';
import { OrderModel, OrderStatus } from '../models/order.model';

const router = Router();

router.get('/stats', authenticate, authorize('admin', 'superadmin'), async (_req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await UserModel.countDocuments();
    const admins = await UserModel.countDocuments({ role: UserRole.ADMIN });
    const superadmins = await UserModel.countDocuments({ role: UserRole.SUPERADMIN });
    const clientes = await UserModel.countDocuments({ role: UserRole.CLIENTE });

    const products = await ProductModel.find().select('name sales prices').lean();
    const totalProducts = products.length;
    const totalSales = products.reduce((sum, p) => sum + (p.sales || 0), 0);

    const completedOrders = await OrderModel.find({ status: OrderStatus.COMPLETED }).lean();
    const orderRevenue = completedOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

    let estimatedRevenue = 0;
    for (const p of products) {
      const minPrice = p.prices?.length ? Math.min(...p.prices.map(pr => pr.price)) : 0;
      estimatedRevenue += (p.sales || 0) * minPrice;
    }

    const totalRevenue = orderRevenue > 0 ? orderRevenue : estimatedRevenue;

    res.json({
      success: true,
      data: {
        totalUsers, admins, superadmins, clientes,
        totalProducts, totalSales, totalRevenue,
      },
    });
  } catch (err) {
    console.error('[Admin] Error fetching stats:', err);
    res.status(500).json({ success: false, message: 'Error al obtener estadísticas', data: {} });
  }
});

router.get('/activity', authenticate, authorize('admin', 'superadmin'), async (_req: AuthRequest, res: Response) => {
  try {
    const recentUsers = await UserModel.find()
      .select('name email role createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const recentProducts = await ProductModel.find()
      .select('name sales createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean();

    const recentMessages = await MessageModel.find({ isDeleted: { $ne: true } })
      .populate('sender', 'name role')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const activity: any[] = [];

    for (const u of recentUsers) {
      activity.push({
        type: 'user',
        user: u.name,
        action: 'se registró en el panel',
        detail: u.email,
        timestamp: u.createdAt,
      });
    }

    for (const p of recentProducts) {
      activity.push({
        type: 'product',
        user: 'Producto',
        action: p.sales > 0 ? `${p.sales} ventas realizadas` : 'añadido al catálogo',
        detail: p.name,
        timestamp: p.updatedAt || p.createdAt,
      });
    }

    for (const m of recentMessages) {
      const senderName = (m.sender as any)?.name || 'Desconocido';
      activity.push({
        type: 'message',
        user: senderName,
        action: 'envió un mensaje',
        detail: '',
        timestamp: m.createdAt,
      });
    }

    activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json({ success: true, data: activity.slice(0, 10) });
  } catch (err) {
    res.json({ success: true, data: [] });
  }
});

router.post('/users', authenticate, authorize('admin', 'superadmin'), async (req: AuthRequest, res: Response) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ message: 'Nombre, email y contraseña son requeridos' });
    return;
  }

  const validRole = Object.values(UserRole).includes(role) ? role : UserRole.ADMIN;

  const exists = await UserModel.findOne({ email: email.toLowerCase() });
  if (exists) {
    res.status(400).json({ message: 'El email ya está registrado' });
    return;
  }

  const user = await UserModel.create({ name, email: email.toLowerCase(), password, role: validRole });
  res.status(201).json({
    success: true,
    data: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

router.get('/users', authenticate, authorize('admin', 'superadmin'), async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      UserModel.find().select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      UserModel.countDocuments(),
    ]);

    res.json({
      success: true,
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('[Admin] Error fetching users:', err);
    res.status(500).json({ success: false, message: 'Error al obtener usuarios', data: [] });
  }
});

router.put('/users/:id/role', authenticate, authorize('admin', 'superadmin'), async (req: AuthRequest, res: Response) => {
  const { role } = req.body;

  if (!Object.values(UserRole).includes(role)) {
    res.status(400).json({ message: 'Rol inválido' });
    return;
  }

  const user = await UserModel.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
  if (!user) {
    res.status(404).json({ message: 'Usuario no encontrado' });
    return;
  }

  res.json({ success: true, data: user });
});

router.put('/users/:id', authenticate, authorize('admin', 'superadmin'), async (req: AuthRequest, res: Response) => {
  const { name, email, password, role } = req.body;
  const update: any = {};

  if (name) update.name = name;
  if (email) update.email = email.toLowerCase();
  if (role && Object.values(UserRole).includes(role)) update.role = role;
  if (password) {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }
    user.password = password;
    await user.save();
  }

  const updated = await UserModel.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
  res.json({ success: true, data: updated });
});

router.delete('/users/:id', authenticate, authorize('admin', 'superadmin'), async (req: AuthRequest, res: Response) => {
  const { id } = req.params as { id: string };

  if (id === req.userId) {
    res.status(400).json({ message: 'No puedes eliminar tu propia cuenta' });
    return;
  }

  const target = await UserModel.findById(id).select('role');
  if (!target) {
    res.status(404).json({ message: 'Usuario no encontrado' });
    return;
  }

  if (target.role === 'admin') {
    res.status(403).json({ message: 'No puedes eliminar a otro administrador' });
    return;
  }

  await UserModel.findByIdAndDelete(id);
  res.json({ success: true, message: 'Usuario eliminado' });
});

export default router;
