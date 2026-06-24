import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '@core/services/api.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  step = 1;
  emailForm: FormGroup;
  resetForm: FormGroup;
  errorMsg = '';
  successMsg = '';
  resetCode = '';
  loading = false;
  btnText = 'ENVIAR CÓDIGO';
  resetBtnText = 'RESTABLECER CONTRASEÑA';
  passwordStrength = { width: '0%', color: 'transparent', text: 'Seguridad de la contraseña' };

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private router: Router
  ) {
    this.emailForm = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
    this.resetForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    });
  }

  requestCode(): void {
    if (this.emailForm.invalid) return;
    this.errorMsg = '';
    this.successMsg = '';
    this.loading = true;
    this.btnText = 'ENVIANDO...';

    this.api.post<any>('auth/forgot-password', { email: this.emailForm.value.email }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.code) {
          this.resetCode = res.code;
        }
        this.successMsg = 'Código enviado. Revisa tu código en la parte inferior.';
        setTimeout(() => { this.step = 2; }, 1500);
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || 'Error al enviar el código';
        this.btnText = 'ENVIAR CÓDIGO';
        this.loading = false;
      }
    });
  }

  resetPassword(): void {
    if (this.resetForm.invalid) return;
    const { newPassword, confirmPassword } = this.resetForm.value;
    if (newPassword !== confirmPassword) {
      this.errorMsg = 'Las contraseñas no coinciden';
      return;
    }
    this.errorMsg = '';
    this.loading = true;
    this.resetBtnText = 'RESTABLECIENDO...';

    this.api.post<any>('auth/reset-password', {
      email: this.emailForm.value.email,
      code: this.resetForm.value.code,
      newPassword
    }).subscribe({
      next: (res) => {
        this.resetBtnText = '✓ CONTRASEÑA RESTABLECIDA';
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 1500);
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || 'Error al restablecer la contraseña';
        this.resetBtnText = 'RESTABLECER CONTRASEÑA';
        this.loading = false;
      }
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
