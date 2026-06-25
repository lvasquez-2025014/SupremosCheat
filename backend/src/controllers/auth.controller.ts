import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserModel } from '../models/user.model';
import { config } from '../config';
import { AuthRequest } from '../middleware/auth.middleware';
import { logEvent } from '../services/logger';
import { LogEventType } from '../models/log.model';

function base64UrlDecode(str: string): Buffer {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return Buffer.from(base64, 'base64');
}

let cachedKeys: { keys: any[]; at: number } | null = null;

async function getGooglePublicKeys(): Promise<any[]> {
  if (cachedKeys && Date.now() - cachedKeys.at < 3600000) return cachedKeys.keys;

  try {
    const resp = await fetch('https://www.googleapis.com/oauth2/v3/certs');
    if (!resp.ok) {
      console.log('[GoogleAuth] Certs fetch failed:', resp.status);
      return cachedKeys?.keys || [];
    }
    const data = await resp.json() as any;
    if (data.keys && Array.isArray(data.keys)) {
      console.log('[GoogleAuth] Fetched', data.keys.length, 'keys. Kids:', data.keys.map((k: any) => k.kid).join(', '));
      cachedKeys = { keys: data.keys, at: Date.now() };
      return data.keys;
    }
    console.log('[GoogleAuth] Unexpected certs response:', JSON.stringify(data).slice(0, 200));
  } catch (err: any) {
    console.log('[GoogleAuth] Certs fetch error:', err.message);
  }

  return cachedKeys?.keys || [];
}

async function verifyGoogleToken(idToken: string): Promise<{ email: string; name: string; sub: string } | null> {
  try {
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      console.log('[GoogleAuth] Invalid token format');
      return null;
    }

    const header = JSON.parse(base64UrlDecode(parts[0]).toString());
    const payload = JSON.parse(base64UrlDecode(parts[1]).toString());

    console.log('[GoogleAuth] alg:', header.alg, 'kid:', header.kid, 'iss:', payload.iss, 'aud:', payload.aud, 'exp:', payload.exp);

    if (header.alg !== 'RS256') return null;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.log('[GoogleAuth] Token expired');
      return null;
    }

    const validIssuers = [
      'https://securetoken.google.com/' + config.firebase.projectId,
      'accounts.google.com',
      'https://accounts.google.com',
    ];
    if (!validIssuers.includes(payload.iss)) {
      console.log('[GoogleAuth] Invalid issuer:', payload.iss);
      return null;
    }

    const validAudiences = [config.firebase.projectId, config.googleClientId].filter(Boolean);
    const aud = Array.isArray(payload.aud) ? payload.aud[0] : payload.aud;
    if (!validAudiences.includes(aud)) {
      console.log('[GoogleAuth] Invalid audience:', aud, 'expected:', validAudiences);
      return null;
    }

    const apiKey = config.firebase.apiKey;
    if (apiKey) {
      try {
        const resp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
        const data = await resp.json() as any;
        if (resp.ok && data.users && data.users[0]) {
          const u = data.users[0];
          console.log('[GoogleAuth] Verified via Identity Toolkit for:', u.email);
          return { email: u.email, name: u.displayName || payload.name || '', sub: u.localId };
        }
        console.log('[GoogleAuth] Identity Toolkit response:', resp.status, JSON.stringify(data).slice(0, 200));
      } catch (e: any) {
        console.log('[GoogleAuth] Identity Toolkit error:', e.message);
      }
    }

    cachedKeys = null;
    const keys = await getGooglePublicKeys();
    const key = keys.find((k: any) => k.kid === header.kid);
    if (key) {
      const publicKey = crypto.createPublicKey({ format: 'jwk', key: { kty: 'RSA', n: key.n, e: key.e } });
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(parts[0] + '.' + parts[1]);
      if (verifier.verify(publicKey, base64UrlDecode(parts[2]))) {
        console.log('[GoogleAuth] Verified via JWKS for:', payload.email);
        if (!payload.email || !payload.sub) return null;
        return { email: payload.email, name: payload.name || '', sub: payload.sub };
      }
    }

    console.log('[GoogleAuth] All verification methods failed');
    return null;
  } catch (err: any) {
    console.log('[GoogleAuth] Error:', err.message);
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
