import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import { Express, Request, Response, NextFunction } from 'express';

export function applySecurity(app: Express): void {
  // Helmet - security headers
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  // Rate limiting general - 100 requests per 15 minutes per IP
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { message: 'Demasiadas peticiones, intenta de nuevo más tarde' },
    standardHeaders: true,
    legacyHeaders: false,
  }));

  // Aggressive rate limit for auth routes - 10 attempts per 15 minutes
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: 'Demasiados intentos de autenticación, espera 15 minutos' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  app.use('/api/auth/google', authLimiter);

  // Strict rate limit for admin routes - 60 per minute
  const adminLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    message: { message: 'Límite de peticiones admin alcanzado' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/admin', adminLimiter);

  // MongoDB injection sanitization - remove $ and . from req.body, req.query, req.params
  app.use(mongoSanitize({
    replaceWith: '_',
  }));

  // Prevent HTTP parameter pollution
  app.use(hpp());

  // XSS protection - sanitize input
  app.use((_req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      try {
        if (body && typeof body === 'object') {
          sanitizeObject(body);
        }
      } catch (e) {
        // Skip sanitization if it fails
      }
      return originalJson(body);
    };
    next();
  });

  // Security headers
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });

  // Block suspicious request patterns
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
        console.log(`[SECURITY BLOCKED] ${req.method} ${req.originalUrl} from ${req.ip}`);
        res.status(403).json({ message: 'Solicitud bloqueada por seguridad' });
        return;
      }
    }
    next();
  });

  // Log suspicious activity
  app.use((req: Request, res: Response, next: NextFunction) => {
    const suspicious = [
      /sqlmap/i,
      /nikto/i,
      /nessus/i,
      /burp/i,
      /owasp/i,
      /acunetix/i,
      /havij/i,
      /w3af/i,
      /masscan/i,
      /nmap/i,
      /dirbuster/i,
      /gobuster/i,
    ];

    const ua = (req.headers['user-agent'] || '').toLowerCase();
    for (const pattern of suspicious) {
      if (pattern.test(ua)) {
        console.log(`[SECURITY ALERT] Suspicious user-agent detected: ${req.headers['user-agent']} from ${req.ip}`);
        res.status(403).json({ message: 'Acceso denegado' });
        return;
      }
    }

    next();
  });
}

function sanitizeObject(obj: any, depth: number = 0): void {
  if (!obj || typeof obj !== 'object' || depth > 10) return;
  if (Array.isArray(obj)) {
    obj.forEach((item) => sanitizeObject(item, depth + 1));
    return;
  }
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'string') {
      obj[key] = obj[key]
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key], depth + 1);
    }
  }
}
