import { Request, Response, NextFunction } from 'express';

function sanitizeInput(value: string): string {
  return value
    .replace(/[<>]/g, '')
    .replace(/['";\\]/g, '')
    .replace(/\$/g, '')
    .trim();
}

export function validateRegister(req: Request, res: Response, next: NextFunction): void {
  const { name, email, password } = req.body;
  const errors: string[] = [];

  if (!name || name.trim().length < 2) errors.push('Nombre debe tener al menos 2 caracteres');
  if (name && name.length > 100) errors.push('Nombre demasiado largo');
  if (email && sanitizeInput(email) !== email.trim()) errors.push('Email contiene caracteres no válidos');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Email inválido');
  if (!password || password.length < 8) errors.push('Contraseña debe tener al menos 8 caracteres');
  if (password && password.length > 128) errors.push('Contraseña demasiado larga');
  if (password && /\s/.test(password)) errors.push('Contraseña no debe contener espacios');

  if (errors.length) {
    res.status(400).json({ message: errors.join('. ') });
    return;
  }

  req.body.name = sanitizeInput(req.body.name);
  req.body.email = sanitizeInput(req.body.email);

  next();
}

export function validateLogin(req: Request, res: Response, next: NextFunction): void {
  const { email, password } = req.body;
  const errors: string[] = [];

  if (!email) errors.push('Email o usuario requerido');
  if (!password) errors.push('Contraseña requerida');
  if (email && typeof email === 'string' && email.length > 200) errors.push('Input demasiado largo');

  if (errors.length) {
    res.status(400).json({ message: errors.join('. ') });
    return;
  }

  next();
}
