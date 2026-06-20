import { Router, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { UserModel, UserRole } from '../models/user.model';

const router = Router();

router.get('/stats', authenticate, authorize('admin'), async (_req: AuthRequest, res: Response) => {
  const totalUsers = await UserModel.countDocuments();
  const admins = await UserModel.countDocuments({ role: UserRole.ADMIN });
  const vendedores = await UserModel.countDocuments({ role: UserRole.VENDEDOR });
  const clientes = await UserModel.countDocuments({ role: UserRole.CLIENTE });

  res.json({
    success: true,
    data: { totalUsers, admins, vendedores, clientes },
  });
});

router.post('/users', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ message: 'Nombre, email y contraseña son requeridos' });
    return;
  }

  const validRole = Object.values(UserRole).includes(role) ? role : UserRole.VENDEDOR;

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

router.get('/users', authenticate, authorize('admin'), async (_req: AuthRequest, res: Response) => {
  const users = await UserModel.find().select('-password').sort({ createdAt: -1 });
  res.json({ success: true, data: users });
});

router.put('/users/:id/role', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
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

router.put('/users/:id', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
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

router.delete('/users/:id', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  const user = await UserModel.findByIdAndDelete(req.params.id);
  if (!user) {
    res.status(404).json({ message: 'Usuario no encontrado' });
    return;
  }
  res.json({ success: true, message: 'Usuario eliminado' });
});

export default router;
