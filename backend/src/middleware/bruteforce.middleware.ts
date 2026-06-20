const loginAttempts = new Map<string, { count: number; lastAttempt: number; blockedUntil: number }>();

const MAX_ATTEMPTS = 5;
const BLOCK_TIME = 30 * 60 * 1000; // 30 minutes
const WINDOW = 15 * 60 * 1000; // 15 minutes

export function checkBruteForce(req: any, res: any, next: any): void {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (record) {
    // Reset if window expired
    if (now - record.lastAttempt > WINDOW) {
      loginAttempts.delete(ip);
    } else if (record.blockedUntil > now) {
      const remaining = Math.ceil((record.blockedUntil - now) / 60000);
      res.status(429).json({
        message: `Cuenta bloqueada temporalmente. Intenta de nuevo en ${remaining} minutos`,
      });
      return;
    }
  }

  // Attach tracking function to request
  req.trackLoginAttempt = (success: boolean) => {
    const current = loginAttempts.get(ip) || { count: 0, lastAttempt: 0, blockedUntil: 0 };

    if (success) {
      loginAttempts.delete(ip);
      return;
    }

    current.count++;
    current.lastAttempt = now;

    if (current.count >= MAX_ATTEMPTS) {
      current.blockedUntil = now + BLOCK_TIME;
      console.log(`[SECURITY] IP ${ip} blocked for ${BLOCK_TIME / 60000} minutes after ${current.count} failed attempts`);
    }

    loginAttempts.set(ip, current);
  };

  next();
}

export function cleanupBruteForce(): void {
  const now = Date.now();
  for (const [ip, record] of loginAttempts.entries()) {
    if (now - record.lastAttempt > WINDOW && now > record.blockedUntil) {
      loginAttempts.delete(ip);
    }
  }
}

// Cleanup every 10 minutes
setInterval(cleanupBruteForce, 10 * 60 * 1000);
