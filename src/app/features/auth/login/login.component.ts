import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  isLoginPanel = true;
  loginForm: FormGroup;
  registerForm: FormGroup;
  loginError = '';
  registerError = '';
  passwordStrength = { width: '0%', color: 'transparent', text: 'Seguridad de la contraseña' };
  loginBtnText = 'INICIAR SESIÓN';
  registerBtnText = 'CREAR CUENTA';
  loginBtnDisabled = false;
  registerBtnDisabled = false;
  googleLoading = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      terms: [false, [Validators.requiredTrue]],
    });
  }

  ngOnInit(): void {
    this.isLoginPanel = !this.router.url.includes('/register');
  }

  switchToRegister(): void {
    this.isLoginPanel = false;
    this.loginError = '';
    this.registerError = '';
  }

  switchToLogin(): void {
    this.isLoginPanel = true;
    this.loginError = '';
    this.registerError = '';
  }

  onGoogleLogin(): void {
    this.googleLoading = true;
    this.loginError = '';
    this.auth.googleLogin()
      .then(() => {
        this.router.navigate(['/']);
      })
      .catch((err: any) => {
        if (err.code === 'auth/popup-closed-by-user') {
          this.loginError = '';
        } else {
          this.loginError = err?.error?.message || err?.message || 'Error al iniciar sesión con Google';
        }
        this.googleLoading = false;
      });
  }

  onGoogleRegister(): void {
    this.googleLoading = true;
    this.registerError = '';
    this.auth.googleLogin()
      .then(() => {
        this.router.navigate(['/']);
      })
      .catch((err: any) => {
        if (err.code === 'auth/popup-closed-by-user') {
          this.registerError = '';
        } else {
          this.registerError = err?.error?.message || err?.message || 'Error al registrarse con Google';
        }
        this.googleLoading = false;
      });
  }

  onLogin(): void {
    if (this.loginForm.invalid) return;
    this.loginError = '';
    this.loginBtnText = 'VERIFICANDO...';
    this.loginBtnDisabled = true;

    this.auth.login({ email: this.loginForm.value.username, password: this.loginForm.value.password }).subscribe({
      next: () => {
        this.loginBtnText = '✓ ACCESO CONCEDIDO';
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 1500);
      },
      error: (err) => {
        this.loginError = err.message;
        this.loginBtnText = 'INICIAR SESIÓN';
        this.loginBtnDisabled = false;
      },
    });
  }

  onRegister(): void {
    if (this.registerForm.invalid) {
      if (!this.registerForm.get('terms')?.value) {
        this.registerError = 'ACEPTA LOS TÉRMINOS';
      }
      return;
    }
    const { password, confirmPassword } = this.registerForm.value;
    if (password !== confirmPassword) {
      this.registerError = 'LAS CONTRASEÑAS NO COINCIDEN';
      return;
    }
    this.registerError = '';
    this.registerBtnText = 'CREANDO CUENTA...';
    this.registerBtnDisabled = true;

    this.auth.register({
      name: this.registerForm.value.name,
      email: this.registerForm.value.email,
      password
    }).subscribe({
      next: () => {
        this.registerBtnText = '✓ CUENTA CREADA';
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 1500);
      },
      error: (err) => {
        this.registerError = err.message;
        this.registerBtnText = 'CREAR CUENTA';
        this.registerBtnDisabled = false;
      },
    });
  }

  onPasswordInput(password: string): void {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const levels = [
      { width: '0%', color: 'transparent', text: 'Seguridad de la contraseña' },
      { width: '25%', color: '#ef4444', text: 'Muy débil' },
      { width: '50%', color: '#f97316', text: 'Débil' },
      { width: '75%', color: '#eab308', text: 'Buena' },
      { width: '100%', color: '#22c55e', text: 'Muy fuerte' },
    ];
    this.passwordStrength = levels[score];
  }

  togglePassword(inputId: string): void {
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
  }
}
