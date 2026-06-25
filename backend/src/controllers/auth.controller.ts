import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { UserModel } from '../models/user.model';
import { config } from '../config';
import { AuthRequest } from '../middleware/auth.middleware';
import { logEvent } from '../services/logger';
import { LogEventType } from '../models/log.model';

async function verifyGoogleToken(idToken: string): Promise<{ email: string; name: string; sub: string } | null> {
  const audiences: string[] = [];
  if (config.firebase.projectId) audiences.push(config.firebase.projectId);
  if (config.googleClientId) audiences.push(config.googleClientId);

  for (const audience of audiences) {
    try {
      const client = new OAuth2Client();
      const ticket = await client.verifyIdToken({ idToken, audience });
      const payload = ticket.getPayload();
      if (payload && payload.email && payload.sub) {
        return { email: payload.email, name: payload.name || '', sub: payload.sub };
      }
    } catch (err: any) {
      console.log(`[GoogleAuth] verifyIdToken failed (audience=${audience}):`, err.message);
    }
  }

  try {
    const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!resp.ok) {
      const body = await resp.text();
      console.log('[GoogleAuth] Tokeninfo failed:', resp.status, body);
      return null;
    }
    const payload = await resp.json() as any;
    if (!payload.email || !payload.sub) return null;
    return { email: payload.email, name: payload.name || '', sub: payload.sub };
  } catch (e2: any) {
    console.log('[GoogleAuth] Tokeninfo fallback error:', e2.message);
    return null;
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function register(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, email, password } = req.body;

    const exists = await UserModel.findOne({ email: email.toLowerCase() });
    if (exists) {
      res.status(400).json({ message: 'El email ya está registrado' });
      return;
    }

    const user = await UserModel.create({ name, email: email.toLowerCase(), password });
    const token = jwt.sign({ id: user.id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

    await logEvent(LogEventType.REGISTER, req, { userName: user.name, email: user.email, success: true });

    res.status(201).json({
      success: true,
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, bio: user.bio, avatar: user.avatar, discord: user.discord, country: user.country, phone: user.phone },
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
}

export async function login(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email y contraseña son requeridos' });
      return;
    }

    const isEmail = email.includes('@');
    const user = isEmail
      ? await UserModel.findOne({ email: email.toLowerCase().trim() })
      : await UserModel.findOne({ name: { $regex: new RegExp(`^${escapeRegex(email.trim())}$`, 'i') } });
    if (!user) {
      await logEvent(LogEventType.LOGIN_FAILED, req, { email, success: false });
      if ((req as any).trackLoginAttempt) (req as any).trackLoginAttempt(false);
      res.status(401).json({ message: 'Credenciales inválidas' });
      return;
    }

    if (user.isActive === false) {
      res.status(403).json({ message: 'Cuenta desactivada. Contacta al administrador.' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      await logEvent(LogEventType.LOGIN_FAILED, req, { userName: user.name, email: user.email, success: false });
      if ((req as any).trackLoginAttempt) (req as any).trackLoginAttempt(false);
      res.status(401).json({ message: 'Credenciales inválidas' });
      return;
    }

    if ((req as any).trackLoginAttempt) (req as any).trackLoginAttempt(true);

    const token = jwt.sign({ id: user.id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

    await logEvent(LogEventType.LOGIN, req, { userName: user.name, email: user.email, success: true });

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, bio: user.bio, avatar: user.avatar, discord: user.discord, country: user.country, phone: user.phone },
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
}

export async function getProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await UserModel.findById(req.userId).select('-password');
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }
    res.json({ success: true, data: user });
  } catch {
    res.status(500).json({ message: 'Error del servidor' });
  }
}

export async function googleLogin(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      res.status(400).json({ message: 'Token de Google requerido' });
      return;
    }

    const payload = await verifyGoogleToken(idToken);

    if (!payload || !payload.email) {
      res.status(401).json({ message: 'Token de Google inválido' });
      return;
    }

    const { email, name, sub: googleId } = payload;

    let user = await UserModel.findOne({ email });

    if (!user) {
      const randomPassword = await bcrypt.hash(googleId, 12);
      user = await UserModel.create({
        name: name || email.split('@')[0],
        email,
        password: randomPassword,
      });
    }

    const token = jwt.sign({ id: user.id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

    await logEvent(LogEventType.GOOGLE_LOGIN, req, { userName: user.name, email: user.email, success: true });

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, bio: user.bio, avatar: user.avatar, discord: user.discord, country: user.country, phone: user.phone },
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al autenticar con Google' });
  }
}

export async function forgotPassword(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ message: 'Email requerido' });
      return;
    }

    const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      res.json({ success: true, message: 'Si el email existe, recibirás un código de recuperación' });
      return;
    }

    const code = crypto.randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    user.resetToken = code;
    user.resetTokenExpiry = expiry;
    await user.save();

    console.log(`[PasswordReset] Code for ${user.email}: ${code}`);

    res.json({ success: true, message: 'Si el email existe, recibirás un código de recuperación', code });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
}

export async function resetPassword(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      res.status(400).json({ message: 'Email, código y nueva contraseña son requeridos' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      res.status(400).json({ message: 'Código inválido o expirado' });
      return;
    }

    if (!user.resetToken || user.resetToken !== code) {
      res.status(400).json({ message: 'Código inválido' });
      return;
    }

    if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      res.status(400).json({ message: 'Código expirado. Solicita uno nuevo' });
      return;
    }

    user.password = newPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    const token = jwt.sign({ id: user.id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
}
