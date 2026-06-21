import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import { Express, Request, Response, NextFunction } from 'express';

export function applySecurity(app: Express): void {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { message: 'Demasiadas peticiones, intenta de nuevo más tarde' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return req.ip || req.socket.remoteAddress || 'unknown';
    },
  }));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: 'Demasiados intentos de autenticación, espera 15 minutos' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return req.ip || req.socket.remoteAddress || 'unknown';
    },
  });
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  app.use('/api/auth/google', authLimiter);

  const adminLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    message: { message: 'Límite de peticiones admin alcanzado' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/admin', adminLimiter);

  app.use(mongoSanitize({
    replaceWith: '_',
  }));

  app.use(hpp());

  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    const blocked = [
      /(\.\.\/)/,
      /(\/etc\/passwd)/,
      /(\/proc\/)/,
      /(cmd\.exe)/i,
      /(powershell)/i,
      /(<script)/i,
      /(javascript:)/i,
      /(on\w+\s*=)/i,
      /(union\s+select)/i,
      /(insert\s+into)/i,
      /(drop\s+table)/i,
      /(\/\.env)/,
      /(\/\.git)/,
      /(wp-admin)/i,
      /(phpmyadmin)/i,
    ];

    const url = req.originalUrl.toLowerCase();
    const bodyStr = JSON.stringify(req.body || {}).toLowerCase();

    for (const pattern of blocked) {
      if (pattern.test(url) || pattern.test(bodyStr)) {
        res.status(403).json({ message: 'Solicitud bloqueada' });
        return;
      }
    }
    next();
  });
}
