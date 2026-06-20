import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import express from 'express';
import cors from 'cors';
import { connectDatabase } from './services/database';
import { config } from './config';
import { applySecurity } from './middleware/security.middleware';
import { ProductModel } from './models/product.model';
import { ConversationModel, MessageModel } from './models/message.model';
import { NotificationModel } from './models/notification.model';
import { UserModel } from './models/user.model';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import productRoutes from './routes/product.routes';
import chatRoutes from './routes/chat.routes';
import configRoutes from './routes/config.routes';
import vendedorRoutes from './routes/vendedor.routes';
import clienteRoutes from './routes/cliente.routes';

const app = express();

applySecurity(app);

const allowedOrigins = [
  'http://localhost:4200',
  'http://127.0.0.1:4200',
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`[SECURITY] CORS blocked from: ${origin}`);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.set('trust proxy', 1);

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/config', configRoutes);
app.use('/api/vendedor', vendedorRoutes);
app.use('/api/cliente', clienteRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function seedProducts() {
  const count = await ProductModel.countDocuments();
  if (count > 0) return;

  const products = [
    {
      name: 'Panel VIP PC',
      description: 'Panel completo para Free Fire en PC con ESP, Aimbot, Radar y más',
      category: 'Free Fire PC',
      prices: [
        { duration: '1 Día', price: 1 },
        { duration: '7 Días', price: 5 },
        { duration: '14 Días', price: 10 },
        { duration: '30 Días', price: 20 },
        { duration: '90 Días', price: 30 },
        { duration: '365 Días', price: 40 },
      ],
      stock: 999,
      badge: 'HOT',
      badgeType: 'danger',
      icon: 'fas fa-desktop',
    },
    {
      name: 'Bypass APK',
      description: 'Bypass para detección APK en Free Fire',
      category: 'Free Fire Bypass',
      prices: [
        { duration: '1 Día', price: 1 },
        { duration: '7 Días', price: 4 },
        { duration: '14 Días', price: 9 },
        { duration: '30 Días', price: 12 },
      ],
      stock: 999,
      badge: 'VIP',
      badgeType: 'info',
      icon: 'fas fa-shield-alt',
    },
    {
      name: 'Panel Proxy Android',
      description: 'Panel proxy para cuentas principales Android',
      category: 'Free Fire Proxy',
      prices: [
        { duration: '1 Día', price: 2 },
        { duration: '3 Días', price: 5 },
        { duration: '7 Días', price: 11 },
        { duration: '30 Días', price: 25 },
      ],
      stock: 999,
      badge: 'ANDROID',
      badgeType: 'success',
      icon: 'fas fa-mobile-alt',
    },
    {
      name: 'Panel Proxy iOS',
      description: 'Panel proxy para cuentas principales iOS',
      category: 'Free Fire Proxy',
      prices: [
        { duration: '1 Día', price: 2 },
        { duration: '3 Días', price: 5 },
        { duration: '7 Días', price: 11 },
        { duration: '30 Días', price: 25 },
      ],
      stock: 999,
      badge: 'iOS',
      badgeType: 'purple',
      icon: 'fas fa-mobile-alt',
    },
    {
      name: 'Diamantes',
      description: 'Diamantes Free Fire baratos',
      category: 'Free Fire Diamantes',
      prices: [],
      stock: 0,
      badge: 'PRÓXIMAMENTE',
      badgeType: 'warning',
      icon: 'fas fa-gem',
    },
  ];

  await ProductModel.insertMany(products);
  console.log('[Seed] 5 productos iniciales creados');
}

async function seedChatData() {
  const convCount = await ConversationModel.countDocuments();
  if (convCount > 0) return;

  const admin = await UserModel.findOne({ role: 'admin' as any });
  if (!admin) return;

  const adminId = (admin as any)._id.toString();

  const channelConvs = [
    { name: 'general', type: 'channel' as const, members: [adminId], description: 'Canal de chat general' },
    { name: 'soporte', type: 'channel' as const, members: [adminId], description: 'Canal de soporte técnico' },
    { name: 'anuncios', type: 'channel' as const, members: [adminId], description: 'Anuncios importantes del panel' },
    { name: 'off-topic', type: 'channel' as const, members: [adminId], description: 'Conversación libre' },
  ];

  const createdConvs = await ConversationModel.insertMany(channelConvs);

  for (const conv of createdConvs) {
    await MessageModel.create({
      sender: admin._id,
      content: `Bienvenido al canal #${conv.name} 🎉`,
      type: 'system',
      conversation: conv._id,
      readBy: [adminId],
    });
  }

  const notifTemplates = [
    { title: 'Bienvenido a Supremo Cheats', message: 'Tu panel de control está listo para usar. Explora las funciones disponibles.', type: 'info', icon: 'fas fa-info-circle', targetRole: '' },
    { title: 'Revisa las novedades', message: 'Hay nuevas funciones agregadas al panel. ¡No te las pierdas!', type: 'info', icon: 'fas fa-star', targetRole: 'cliente' },
    { title: 'Productos actualizados', message: 'Se han agregado nuevos productos al catálogo. Revisa la tienda.', type: 'success', icon: 'fas fa-box', targetRole: 'cliente' },
    { title: 'Soporte disponible', message: '¿Necesitas ayuda? Usa el canal de soporte o contacta por Discord.', type: 'info', icon: 'fas fa-headset', targetRole: 'cliente' },
    { title: 'Panel de vendedor listo', message: 'Tu dashboard de vendedor está activo. Gestiona tus productos y pedidos.', type: 'success', icon: 'fas fa-store', targetRole: 'vendedor' },
    { title: 'Nuevas herramientas', message: 'Se agregaron herramientas de edición de productos para vendedores.', type: 'info', icon: 'fas fa-tools', targetRole: 'vendedor' },
    { title: 'Recordatorio de ventas', message: 'Revisa tus estadísticas de ventas del mes en el dashboard.', type: 'warning', icon: 'fas fa-chart-line', targetRole: 'vendedor' },
    { title: 'Sistema actualizado', message: 'El panel ha sido actualizado con mejoras de rendimiento y seguridad.', type: 'success', icon: 'fas fa-shield-alt', targetRole: 'admin' },
    { title: 'Gestión de usuarios', message: 'Recuerda revisar los nuevos registros de usuarios en el panel.', type: 'info', icon: 'fas fa-users', targetRole: 'admin' },
  ];

  await NotificationModel.insertMany(notifTemplates.map(n => ({
    ...n,
    user: admin._id,
    isRead: false,
  })));

  console.log('[Seed] Conversaciones y notificaciones creadas');
}

async function start() {
  await connectDatabase();
  await seedProducts();
  await seedChatData();
  app.listen(config.port, () => {
    console.log(`[Server] Corriendo en http://localhost:${config.port}`);
  });
}

start();
