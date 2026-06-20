import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import https from 'https';
import { UserModel } from '../models/user.model';
import { config } from '../config';
import { AuthRequest } from '../middleware/auth.middleware';

function verifyGoogleToken(idToken: string): Promise<{ email: string; name: string; sub: string } | null> {
  return new Promise((resolve) => {
    https.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`, (res) => {
      if (res.statusCode !== 200) {
        resolve(null);
        return;
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const payload = JSON.parse(data);
          if (!payload.email || !payload.sub) { resolve(null); return; }
          resolve({ email: payload.email, name: payload.name || '', sub: payload.sub });
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

export async function register(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, email, password } = req.body;

    const exists = await UserModel.findOne({ email });
    if (exists) {
      res.status(400).json({ message: 'El email ya está registrado' });
      return;
    }

    const user = await UserModel.create({ name, email, password });
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

    const user = await UserModel.findOne({
      $or: [
        { email: { $regex: new RegExp(`^${email}$`, 'i') } },
        { name: { $regex: new RegExp(`^${email}$`, 'i') } },
      ],
    });
    if (!user) {
      res.status(401).json({ message: 'Credenciales inválidas' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ message: 'Credenciales inválidas' });
      return;
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
  } catch (error: any) {
    console.error('[Google Auth Error]', error.message);
    res.status(500).json({ message: 'Error al autenticar con Google' });
  }
}
