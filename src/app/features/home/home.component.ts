import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { ApiService } from '@core/services/api.service';
import { ChatService } from '@core/services/chat.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, AfterViewInit {
  @ViewChild('revenueChart') revenueChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryChart') categoryChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('earningsChart') earningsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('analyticsVisits') analyticsVisitsRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('analyticsSales') analyticsSalesRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('analyticsConversion') analyticsConversionRef!: ElementRef<HTMLCanvasElement>;

  activeSection = 'dashboard';
  sidebarCollapsed = false;
  searchQuery = '';
  mobileMenuOpen = false;

  user: any = null;
  discordUrl = 'https://discord.gg/HazXhwWMS';
  todayDate = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  get isClient(): boolean {
    return this.user?.role === 'cliente';
  }

  get isAdmin(): boolean {
    return this.user?.role === 'admin';
  }

  get isVendor(): boolean {
    return this.user?.role === 'vendedor';
  }

  navItems = [
    { name: 'Tienda', icon: 'fas fa-store', section: 'tienda', badge: 0 },
    { name: 'Chat en vivo', icon: 'fas fa-comments', section: 'chat', badge: 0 },
    { name: 'Mis Pedidos', icon: 'fas fa-shopping-cart', section: 'mis-pedidos', badge: 0 },
    { name: 'Notificaciones', icon: 'fas fa-bell', section: 'notificaciones', badge: 0 },
    { name: 'Soporte', icon: 'fas fa-headset', section: 'soporte', badge: 0 },
  ];

  vendorNavItems = [
    { name: 'Dashboard', icon: 'fas fa-th-large', section: 'dashboard' },
    { name: 'Productos', icon: 'fas fa-box', section: 'productos' },
    { name: 'Pedidos', icon: 'fas fa-shopping-cart', section: 'pedidos' },
    { name: 'Chat en vivo', icon: 'fas fa-comments', section: 'chat' },
    { name: 'Notificaciones', icon: 'fas fa-bell', section: 'notificaciones', badge: 0 },
    { name: 'Configuración', icon: 'fas fa-cog', section: 'config' },
  ];

  adminNavItems = [
    { name: 'Dashboard', icon: 'fas fa-th-large', section: 'dashboard' },
    { name: 'Productos', icon: 'fas fa-box', section: 'productos' },
    { name: 'Pedidos', icon: 'fas fa-shopping-cart', section: 'pedidos' },
    { name: 'Ganancias', icon: 'fas fa-wallet', section: 'ganancias' },
    { name: 'Socios', icon: 'fas fa-handshake', section: 'socios' },
    { name: 'Analíticas', icon: 'fas fa-chart-line', section: 'analytics' },
    { name: 'Chat en vivo', icon: 'fas fa-comments', section: 'chat' },
    { name: 'Notificaciones', icon: 'fas fa-bell', section: 'notificaciones', badge: 0 },
    { name: 'Configuración', icon: 'fas fa-cog', section: 'config' },
  ];

  statsCards = [
    { title: 'Ganancias Totales', value: '$0.00', change: '+0%', changeType: 'positive', icon: 'fas fa-dollar-sign', color: 'cyan' },
    { title: 'Ventas del Mes', value: '0', change: '+0%', changeType: 'positive', icon: 'fas fa-shopping-bag', color: 'pink' },
    { title: 'Socios Activos', value: '0', change: '+0%', changeType: 'positive', icon: 'fas fa-users', color: 'lime' },
    { title: 'Tasa de Conversión', value: '0%', change: '+0%', changeType: 'positive', icon: 'fas fa-chart-pie', color: 'violet' },
  ];

  products = [
    {
      id: 1,
      name: 'Panel VIP PC',
      description: 'Panel completo para Free Fire en PC con ESP, Aimbot, Radar y más',
      category: 'Free Fire PC',
      prices: [
        { duration: '1 Día', price: 1 },
        { duration: '7 Días', price: 5 },
        { duration: '14 Días', price: 10 },
        { duration: '30 Días', price: 20 },
        { duration: '90 Días', price: 30 },
        { duration: '365 Días', price: 40 }
      ],
      priceFrom: 1,
      priceTo: 40,
      stock: 999,
      status: 'active',
      badge: 'HOT',
      badgeType: 'danger',
      sales: 0,
      icon: 'fas fa-desktop'
    },
    {
      id: 2,
      name: 'Bypass APK',
      description: 'Bypass para detección APK en Free Fire',
      category: 'Free Fire Bypass',
      prices: [
        { duration: '1 Día', price: 1 },
        { duration: '7 Días', price: 4 },
        { duration: '14 Días', price: 9 },
        { duration: '30 Días', price: 12 }
      ],
      priceFrom: 1,
      priceTo: 12,
      stock: 999,
      status: 'active',
      badge: 'VIP',
      badgeType: 'info',
      sales: 0,
      icon: 'fas fa-shield-alt'
    },
    {
      id: 3,
      name: 'Panel Proxy Android',
      description: 'Panel proxy para cuentas principales Android',
      category: 'Free Fire Proxy',
      prices: [
        { duration: '1 Día', price: 2 },
        { duration: '3 Días', price: 5 },
        { duration: '7 Días', price: 11 },
        { duration: '30 Días', price: 25 }
      ],
      priceFrom: 2,
      priceTo: 25,
      stock: 999,
      status: 'active',
      badge: 'ANDROID',
      badgeType: 'success',
      sales: 0,
      icon: 'fas fa-mobile-alt'
    },
    {
      id: 4,
      name: 'Panel Proxy iOS',
      description: 'Panel proxy para cuentas principales iOS',
      category: 'Free Fire Proxy',
      prices: [
        { duration: '1 Día', price: 2 },
        { duration: '3 Días', price: 5 },
        { duration: '7 Días', price: 11 },
        { duration: '30 Días', price: 25 }
      ],
      priceFrom: 2,
      priceTo: 25,
      stock: 999,
      status: 'active',
      badge: 'iOS',
      badgeType: 'purple',
      sales: 0,
      icon: 'fas fa-mobile-alt'
    },
    {
      id: 5,
      name: 'Diamantes',
      description: 'Diamantes Free Fire baratos',
      category: 'Free Fire Diamantes',
      prices: [],
      priceFrom: 0,
      priceTo: 0,
      stock: 0,
      status: 'active',
      badge: 'PRÓXIMAMENTE',
      badgeType: 'warning',
      sales: 0,
      icon: 'fas fa-gem'
    }
  ];

  orders: any[] = [];

  transactions: any[] = [];

  partners: any[] = [];

  notifications = [
    { id: 1, title: 'Bienvenido a Supremo Cheats', message: 'Tu panel de control está listo para usar', time: 'Ahora', read: false, icon: 'fas fa-info-circle', color: 'cyan' }
  ];

  recentActivity = [
    { user: 'Sistema', action: 'Panel actualizado correctamente', product: '', time: 'Ahora' },
    { user: 'Sistema', action: 'Productos cargados en el catálogo', product: 'Panel VIP PC, Bypass APK', time: 'Hace 1 min' },
    { user: 'Sistema', action: 'Bienvenido a Supremo Cheats', product: '', time: 'Hace 2 min' },
  ];

  topProducts = [
    { name: 'Panel VIP PC', sales: 0, revenue: '$0.00', trend: 0, priceRange: '$1 - $40' },
    { name: 'Bypass APK', sales: 0, revenue: '$0.00', trend: 0, priceRange: '$1 - $12' },
    { name: 'Panel Proxy Android', sales: 0, revenue: '$0.00', trend: 0, priceRange: '$2 - $25' },
    { name: 'Panel Proxy iOS', sales: 0, revenue: '$0.00', trend: 0, priceRange: '$2 - $25' },
  ];

  settings = {
    storeName: 'Supremo Cheats',
    storeEmail: 'admin@supremocheats.com',
    notifications: true,
    emailAlerts: true,
    darkMode: true,
    twoFactor: false,
  };

  showPartnerModal = false;
  editingPartner: any = null;
  partnerForm = { name: '', email: '', password: '' };
  partnerError = '';
  partnerSuccess = '';

  get isGuest(): boolean {
    return !this.auth.isLoggedIn;
  }

  showPaymentModal = false;
  selectedProduct: any = null;
  selectedPlan: any = null;

  // Chat
  chatConversations: any[] = [];
  chatChannels: any[] = [];
  activeChat: any = null;
  chatMessages: any[] = [];
  chatInput = '';
  chatLoading = false;
  chatUsers: any[] = [];
  showChatModal = false;

  // Notifications from API
  apiNotifications: any[] = [];
  showNotifications = false;

  paymentMethods = [
    { id: 'paypal', name: 'PayPal', icon: 'fab fa-paypal', color: '#003087', description: 'Pago instantáneo con PayPal' },
    { id: 'binance', name: 'Binance Pay', icon: 'fas fa-coins', color: '#f0b90b', description: 'Paga con BNB, BTC, USDT y más' },
    { id: 'transferencia', name: 'Transferencia Bancaria', icon: 'fas fa-university', color: '#22d3ee', description: 'Transferencia o depósito directo' },
  ];

  constructor(
    private auth: AuthService,
    private router: Router,
    private api: ApiService,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    this.user = this.auth.user;
    if (this.isClient) {
      this.activeSection = 'tienda';
    }
    this.loadProducts();
    this.loadChat();
    this.loadNotifications();
    if (!this.isClient) {
      this.loadPartners();
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initCharts(), 100);
  }

  showSection(section: string): void {
    this.activeSection = section;
    this.mobileMenuOpen = false;
    if (section === 'dashboard' || section === 'analytics' || section === 'ganancias') {
      setTimeout(() => this.initCharts(), 50);
    }
  }

  get activeNavItems() {
    if (this.isClient) return this.navItems;
    if (this.isVendor) return this.vendorNavItems;
    return this.adminNavItems;
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  logout(): void {
    this.auth.logout();
  }

  get unreadNotifications(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  get totalRevenue(): number {
    return this.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  get totalExpenses(): number {
    return Math.abs(this.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0));
  }

  loadPartners(): void {
    this.api.get<any>('admin/users').subscribe({
      next: (res) => {
        this.partners = (res.data || []).filter((u: any) => u.role === 'vendedor');
      },
      error: () => {}
    });
  }

  loadProducts(): void {
    this.api.get<any>('products').subscribe({
      next: (res) => {
        if (res.data && res.data.length > 0) {
          this.products = res.data.map((p: any) => ({
            ...p,
            id: p._id,
            priceFrom: p.prices?.length > 0 ? Math.min(...p.prices.map((pr: any) => pr.price)) : 0,
            priceTo: p.prices?.length > 0 ? Math.max(...p.prices.map((pr: any) => pr.price)) : 0,
          }));
        }
      },
      error: () => {}
    });
  }

  loadChat(): void {
    this.chatService.getConversations().subscribe({
      next: (res) => {
        if (res.data) {
          this.chatChannels = res.data.filter((c: any) => c.type === 'channel');
          this.chatConversations = res.data.filter((c: any) => c.type !== 'channel');
        }
      },
      error: () => {}
    });
  }

  loadNotifications(): void {
    this.chatService.getNotifications().subscribe({
      next: (res) => {
        if (res.data) {
          this.apiNotifications = res.data;
        }
      },
      error: () => {}
    });
  }

  openChatChannel(channel: any): void {
    this.activeChat = channel;
    this.chatMessages = [];
    this.chatLoading = true;
    this.chatService.getMessages(channel._id).subscribe({
      next: (res) => {
        this.chatMessages = res.data || [];
        this.chatLoading = false;
        this.chatService.markAsRead(channel._id).subscribe();
      },
      error: () => { this.chatLoading = false; }
    });
  }

  sendChatMessage(): void {
    if (!this.chatInput.trim() || !this.activeChat) return;
    const content = this.chatInput.trim();
    this.chatInput = '';
    this.chatService.sendMessage(this.activeChat._id, content).subscribe({
      next: (res) => {
        if (res.data) {
          this.chatMessages.push(res.data);
        }
      },
      error: () => {}
    });
  }

  openNewChatModal(): void {
    this.chatService.getChatUsers().subscribe({
      next: (res) => {
        this.chatUsers = (res.data || []).filter((u: any) => u._id !== this.user?.id);
        this.showChatModal = true;
      },
      error: () => {}
    });
  }

  startDirectChat(userId: string): void {
    this.chatService.createConversation(userId).subscribe({
      next: (res) => {
        if (res.data) {
          this.showChatModal = false;
          this.loadChat();
          setTimeout(() => this.openChatChannel(res.data), 300);
        }
      },
      error: () => {}
    });
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  markNotifRead(id: string): void {
    this.chatService.markNotificationRead(id).subscribe({
      next: () => {
        const n = this.apiNotifications.find((x: any) => x._id === id);
        if (n) n.isRead = true;
      },
      error: () => {}
    });
  }

  markAllNotifsRead(): void {
    this.chatService.markAllNotificationsRead().subscribe({
      next: () => {
        this.apiNotifications.forEach((n: any) => n.isRead = true);
      },
      error: () => {}
    });
  }

  get unreadNotifCount(): number {
    return this.apiNotifications.filter((n: any) => !n.isRead).length;
  }

  openPartnerModal(partner?: any): void {
    this.partnerError = '';
    this.partnerSuccess = '';
    if (partner) {
      this.editingPartner = partner;
      this.partnerForm = { name: partner.name, email: partner.email, password: '' };
    } else {
      this.editingPartner = null;
      this.partnerForm = { name: '', email: '', password: '' };
    }
    this.showPartnerModal = true;
  }

  closePartnerModal(): void {
    this.showPartnerModal = false;
    this.editingPartner = null;
    this.partnerForm = { name: '', email: '', password: '' };
    this.partnerError = '';
    this.partnerSuccess = '';
  }

  savePartner(): void {
    this.partnerError = '';
    const { name, email, password } = this.partnerForm;

    if (!name || !email) {
      this.partnerError = 'Nombre y email son requeridos';
      return;
    }

    if (!this.editingPartner && !password) {
      this.partnerError = 'La contraseña es requerida';
      return;
    }

    if (this.editingPartner) {
      const body: any = { name, email };
      if (password) body.password = password;
      this.api.put<any>(`admin/users/${this.editingPartner._id}`, body).subscribe({
        next: () => {
          this.partnerSuccess = 'Socio actualizado';
          this.loadPartners();
          setTimeout(() => this.closePartnerModal(), 1200);
        },
        error: (err) => this.partnerError = err.error?.message || 'Error al actualizar'
      });
    } else {
      this.api.post<any>('admin/users', { name, email, password, role: 'vendedor' }).subscribe({
        next: () => {
          this.partnerSuccess = 'Socio creado';
          this.loadPartners();
          setTimeout(() => this.closePartnerModal(), 1200);
        },
        error: (err) => this.partnerError = err.error?.message || 'Error al crear socio'
      });
    }
  }

  deletePartner(partner: any): void {
    if (!confirm(`¿Eliminar a ${partner.name}?`)) return;
    this.api.delete<any>(`admin/users/${partner._id}`).subscribe({
      next: () => this.loadPartners(),
      error: () => {}
    });
  }

  buyProduct(product: any): void {
    if (this.isGuest) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.selectedProduct = product;
    this.selectedPlan = null;
    this.showPaymentModal = true;
  }

  selectPlan(plan: any): void {
    this.selectedPlan = plan;
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.selectedProduct = null;
    this.selectedPlan = null;
  }

  processPayment(methodId: string): void {
    if (!this.selectedProduct || !this.selectedPlan) return;

    if (methodId === 'transferencia') {
      window.open(this.discordUrl, '_blank');
      this.closePaymentModal();
      return;
    }

    if (methodId === 'paypal') {
      const paypalUrl = `https://paypal.me/SupremoCheats/${this.selectedPlan.price}USD`;
      window.open(paypalUrl, '_blank');
      this.closePaymentModal();
      return;
    }

    if (methodId === 'binance') {
      window.open(this.discordUrl, '_blank');
      this.closePaymentModal();
      return;
    }
  }

  private charts: Chart[] = [];

  private initCharts(): void {
    this.destroyCharts();

    if (this.activeSection === 'dashboard') {
      this.initRevenueChart();
      this.initCategoryChart();
    } else if (this.activeSection === 'ganancias') {
      this.initEarningsChart();
    } else if (this.activeSection === 'analytics') {
      this.initAnalyticsCharts();
    }
  }

  private destroyCharts(): void {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
  }

  private initRevenueChart(): void {
    if (!this.revenueChartRef) return;
    const ctx = this.revenueChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.charts.push(new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
        datasets: [{
          label: 'Ingresos',
          data: [0, 0, 0, 0, 0, 0],
          borderColor: '#22d3ee',
          backgroundColor: 'rgba(34, 211, 238, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#22d3ee',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(26, 26, 31, 0.9)',
            titleColor: '#22d3ee',
            bodyColor: '#fff',
            borderColor: '#22d3ee',
            borderWidth: 1,
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#9ca3af' }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#9ca3af', callback: (v: any) => '$' + v.toLocaleString() }
          }
        }
      }
    }));
  }

  private initCategoryChart(): void {
    if (!this.categoryChartRef) return;
    const ctx = this.categoryChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.charts.push(new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Panel VIP PC', 'Bypass APK', 'Panel Proxy Android', 'Panel Proxy iOS', 'Diamantes'],
        datasets: [{
          data: [0, 0, 0, 0, 0],
          backgroundColor: ['#22d3ee', '#f472b6', '#84cc16', '#a78bfa', '#fbbf24'],
          borderColor: '#1a1a1f',
          borderWidth: 3,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#9ca3af', padding: 20, usePointStyle: true }
          }
        }
      }
    }));
  }

  private initEarningsChart(): void {
    if (!this.earningsChartRef) return;
    const ctx = this.earningsChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.charts.push(new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        datasets: [{
          label: 'Ganancias',
          data: [0, 0, 0, 0, 0, 0, 0],
          backgroundColor: 'rgba(34, 211, 238, 0.6)',
          borderColor: '#22d3ee',
          borderWidth: 1,
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#9ca3af' }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#9ca3af', callback: (v: any) => '$' + v.toLocaleString() }
          }
        }
      }
    }));
  }

  private initAnalyticsCharts(): void {
    if (this.analyticsVisitsRef) {
      const ctx1 = this.analyticsVisitsRef.nativeElement.getContext('2d');
      if (ctx1) {
        this.charts.push(new Chart(ctx1, {
          type: 'line',
          data: {
            labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            datasets: [{
              label: 'Visitas',
              data: [0, 0, 0, 0, 0, 0, 0],
              borderColor: '#22d3ee',
              backgroundColor: 'rgba(34, 211, 238, 0.1)',
              fill: true,
              tension: 0.4,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } },
              y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } }
            }
          }
        }));
      }
    }

    if (this.analyticsSalesRef) {
      const ctx2 = this.analyticsSalesRef.nativeElement.getContext('2d');
      if (ctx2) {
        this.charts.push(new Chart(ctx2, {
          type: 'bar',
          data: {
            labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            datasets: [{
              label: 'Ventas',
              data: [0, 0, 0, 0, 0, 0, 0],
              backgroundColor: 'rgba(244, 114, 182, 0.6)',
              borderColor: '#f472b6',
              borderWidth: 1,
              borderRadius: 6,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } },
              y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } }
            }
          }
        }));
      }
    }

    if (this.analyticsConversionRef) {
      const ctx3 = this.analyticsConversionRef.nativeElement.getContext('2d');
      if (ctx3) {
        this.charts.push(new Chart(ctx3, {
          type: 'doughnut',
          data: {
            labels: ['Convertidos', 'Abandonados', 'Pendientes'],
            datasets: [{
              data: [0, 0, 100],
              backgroundColor: ['#84cc16', '#ef4444', '#a78bfa'],
              borderColor: '#1a1a1f',
              borderWidth: 3,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
              legend: { position: 'bottom', labels: { color: '#9ca3af', padding: 20, usePointStyle: true } }
            }
          }
        }));
      }
    }
  }
}
