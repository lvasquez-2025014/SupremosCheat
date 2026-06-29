import { Component, OnInit } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { ApiService } from '@core/services/api.service';
import { ThemeService, ThemeColor } from '@core/services/theme.service';
import { PaymentMethodOption } from '@models/index';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  settings = {
    storeName: 'Asmodeus Developer',
    storeEmail: 'admin@asmodeusdev.com',
    notifications: true,
    emailAlerts: true,
    darkMode: true,
    twoFactor: false,
  };

  paymentMethods: PaymentMethodOption[] = [
    { id: 'paypal', name: 'PayPal', icon: 'fab fa-paypal', color: '#003087', description: 'Pago instantáneo con PayPal' },
    { id: 'binance', name: 'Binance Pay', icon: 'fas fa-coins', color: '#f0b90b', description: 'Paga con BNB, BTC, USDT y más' },
    { id: 'transferencia', name: 'Transferencia Bancaria', icon: 'fas fa-university', color: '#22d3ee', description: 'Transferencia o depósito directo' },
  ];

  toasts: { id: number; title: string; message: string; type: string }[] = [];
  private toastCounter = 0;

  constructor(
    private auth: AuthService,
    private api: ApiService,
    public themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    const saved = localStorage.getItem('asmodeus_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.settings = { ...this.settings, ...parsed };
      } catch {}
    }
  }

  saveSettings(): void {
    localStorage.setItem('asmodeus_settings', JSON.stringify(this.settings));
    this.showToast('Configuración guardada', 'Los cambios han sido aplicados', 'success');
  }

  selectTheme(theme: ThemeColor): void {
    this.themeService.setTheme(theme);
    this.showToast('Tema actualizado', `Tema "${theme.label}" aplicado correctamente`, 'success');
  }

  toggleNotifications(): void {
    this.settings.notifications = !this.settings.notifications;
    this.saveSettings();
  }

  toggleEmailAlerts(): void {
    this.settings.emailAlerts = !this.settings.emailAlerts;
    this.saveSettings();
  }

  toggleDarkMode(): void {
    this.settings.darkMode = !this.settings.darkMode;
    this.saveSettings();
  }

  toggleTwoFactor(): void {
    this.settings.twoFactor = !this.settings.twoFactor;
    this.saveSettings();
  }

  deleteAccount(): void {
    if (confirm('¿Estás seguro de que deseas eliminar tu cuenta? Esta acción es irreversible.')) {
      this.showToast('Cuenta eliminada', 'Tu cuenta ha sido eliminada', 'error');
    }
  }

  exportData(): void {
    const data = {
      settings: this.settings,
      theme: this.themeService.currentTheme.name,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'asmodeus-settings-export.json';
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('Datos exportados', 'El archivo se ha descargado', 'success');
  }

  showToast(title: string, message: string, type: string = 'info'): void {
    const id = ++this.toastCounter;
    this.toasts.push({ id, title, message, type });
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== id);
    }, 3000);
  }
}
