import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { UserModel } from '../models/user.model';
import { config } from '../config';
import { AuthRequest } from '../middleware/auth.middleware';

const googleClient = new OAuth2Client(config.googleClientId);

async function verifyGoogleToken(idToken: string): Promise<{ email: string; name: string; sub: string } | null> {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: config.googleClientId,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) return null;
    return { email: payload.email, name: payload.name || '', sub: payload.sub };
  } catch {
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

    res.status(201).json({
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

export async function login(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email y contraseña son requeridos' });
      return;
    }

    const safeEmail = email.toLowerCase().trim();
    const escaped = escapeRegex(safeEmail);

    const user = await UserModel.findOne({
      $or: [
        { email: { $regex: new RegExp(`^${escaped}$`, 'i') } },
        { name: { $regex: new RegExp(`^${escaped}$`, 'i') } },
      ],
    });
    if (!user) {
      if ((req as any).trackLoginAttempt) (req as any).trackLoginAttempt(false);
      res.status(401).json({ message: 'Credenciales inválidas' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      if ((req as any).trackLoginAttempt) (req as any).trackLoginAttempt(false);
      res.status(401).json({ message: 'Credenciales inválidas' });
      return;
    }

    if ((req as any).trackLoginAttempt) (req as any).trackLoginAttempt(true);

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

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al autenticar con Google' });
  }
}
