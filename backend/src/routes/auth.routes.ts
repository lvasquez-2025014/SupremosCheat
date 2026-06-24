import { Router } from 'express';
import { login, register, getProfile, googleLogin, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { validateRegister, validateLogin } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { checkBruteForce } from '../middleware/bruteforce.middleware';

const router = Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, checkBruteForce, login);
router.post('/google', googleLogin);
router.get('/profile', authenticate, getProfile);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
