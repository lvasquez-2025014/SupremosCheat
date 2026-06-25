import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { ApiService } from '@core/services/api.service';
import { PanelStateService } from '@core/services/panel-state.service';

import { environment } from '@env/environment';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  imageUrl = environment.apiUrl.replace(/\/api\/?$/, '');

  activeSection = 'dashboard';
  loading = true;
  sidebarCollapsed = false;
  mobileMenuOpen = false;

  user: any = null;
  todayDate = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  currentTime = '';
  userLocation = '';
  private clockInterval: any;

  get isClient(): boolean { return this.user?.role === 'cliente'; }
  get isAdmin(): boolean { return this.user?.role === 'admin' || this.user?.role === 'superadmin'; }
  get isSuperAdmin(): boolean { return this.user?.role === 'superadmin'; }
  get isGuest(): boolean { return !this.auth.isLoggedIn; }

  clientNavSections = [
    {
      title: 'NAVEGACIÓN',
      items: [
        { name: 'Tienda', icon: 'fas fa-store', section: 'tienda' },
        { name: 'Mis Pedidos', icon: 'fas fa-shopping-cart', section: 'mis-pedidos' },
        { name: 'Chat', icon: 'fas fa-comments', section: 'chat' },
      ]
    },
    {
      title: 'MI CUENTA',
      items: [
        { name: 'Mi Perfil', icon: 'fas fa-user', section: 'mi-perfil' },
        { name: 'Mi Rango', icon: 'fas fa-crown', section: 'mi-rango' },
        { name: 'Mis Compras', icon: 'fas fa-shopping-bag', section: 'mis-compras' },
      ]
    },
    {
      title: 'SISTEMA',
      items: [
        { name: 'Cerrar Sesión', icon: 'fas fa-sign-out-alt', section: 'logout' },
      ]
    }
  ];

  adminNavSections = [
    {
      title: 'NAVEGACIÓN',
      items: [
        { name: 'Inicio', icon: 'fas fa-home', section: 'dashboard' },
        { name: 'Productos', icon: 'fas fa-box', section: 'productos' },
        { name: 'Pedidos', icon: 'fas fa-shopping-cart', section: 'pedidos' },
        { name: 'Ganancias', icon: 'fas fa-wallet', section: 'ganancias' },
      ]
    },
    {
      title: 'ADMINISTRACIÓN',
      items: [
        { name: 'Usuarios', icon: 'fas fa-users', section: 'usuarios' },
        { name: 'Analíticas', icon: 'fas fa-chart-line', section: 'analytics' },
        { name: 'Chat', icon: 'fas fa-comments', section: 'chat' },
        { name: 'Notificaciones', icon: 'fas fa-bell', section: 'notificaciones' },
      ]
    },
    {
      title: 'MI CUENTA',
      items: [
        { name: 'Mi Perfil', icon: 'fas fa-user', section: 'mi-perfil' },
      ]
    },
    {
      title: 'SISTEMA',
      items: [
        { name: 'Configuración', icon: 'fas fa-cog', section: 'config' },
        { name: 'Cerrar Sesión', icon: 'fas fa-sign-out-alt', section: 'logout' },
      ]
    }
  ];

  superAdminNavSections = [
    {
      title: 'NAVEGACIÓN',
      items: [
        { name: 'Inicio', icon: 'fas fa-home', section: 'dashboard' },
        { name: 'Productos', icon: 'fas fa-box', section: 'productos' },
        { name: 'Pedidos', icon: 'fas fa-shopping-cart', section: 'pedidos' },
        { name: 'Ganancias', icon: 'fas fa-wallet', section: 'ganancias' },
      ]
    },
    {
      title: 'ADMINISTRACIÓN',
      items: [
        { name: 'Usuarios', icon: 'fas fa-users', section: 'usuarios' },
        { name: 'Analíticas', icon: 'fas fa-chart-line', section: 'analytics' },
        { name: 'Chat', icon: 'fas fa-comments', section: 'chat' },
        { name: 'Notificaciones', icon: 'fas fa-bell', section: 'notificaciones' },
      ]
    },
    {
      title: 'TOOLS',
      items: [
        { name: 'Logs', icon: 'fas fa-terminal', section: 'logs' },
        { name: 'CMD', icon: 'fas fa-code', section: 'cmd' },
      ]
    },
    {
      title: 'MI CUENTA',
      items: [
        { name: 'Mi Perfil', icon: 'fas fa-user', section: 'mi-perfil' },
      ]
    },
    {
      title: 'SISTEMA',
      items: [
        { name: 'Configuración', icon: 'fas fa-cog', section: 'config' },
        { name: 'Cerrar Sesión', icon: 'fas fa-sign-out-alt', section: 'logout' },
      ]
    }
  ];

  products = [
    { id: 1, name: 'Panel VIP PC', description: 'Panel completo para Free Fire en PC con ESP, Aimbot, Radar y más', category: 'Free Fire PC', prices: [{ duration: '1 Día', price: 1 }, { duration: '7 Días', price: 5 }, { duration: '14 Días', price: 10 }, { duration: '30 Días', price: 20 }, { duration: '90 Días', price: 30 }, { duration: '365 Días', price: 40 }], priceFrom: 1, priceTo: 40, stock: 999, status: 'active', badge: 'HOT', badgeType: 'danger', sales: 0, icon: 'fas fa-desktop', image: '' },
    { id: 2, name: 'Bypass APK', description: 'Bypass para detección APK en Free Fire', category: 'Free Fire Bypass', prices: [{ duration: '1 Día', price: 1 }, { duration: '7 Días', price: 4 }, { duration: '14 Días', price: 9 }, { duration: '30 Días', price: 12 }], priceFrom: 1, priceTo: 12, stock: 999, status: 'active', badge: 'VIP', badgeType: 'info', sales: 0, icon: 'fas fa-shield-alt', image: '' },
    { id: 3, name: 'Panel Proxy Android', description: 'Panel proxy para cuentas principales Android', category: 'Free Fire Proxy', prices: [{ duration: '1 Día', price: 2 }, { duration: '3 Días', price: 5 }, { duration: '7 Días', price: 11 }, { duration: '30 Días', price: 25 }], priceFrom: 2, priceTo: 25, stock: 999, status: 'active', badge: 'ANDROID', badgeType: 'success', sales: 0, icon: 'fas fa-mobile-alt', image: '' },
    { id: 4, name: 'Panel Proxy iOS', description: 'Panel proxy para cuentas principales iOS', category: 'Free Fire Proxy', prices: [{ duration: '1 Día', price: 2 }, { duration: '3 Días', price: 5 }, { duration: '7 Días', price: 11 }, { duration: '30 Días', price: 25 }], priceFrom: 2, priceTo: 25, stock: 999, status: 'active', badge: 'iOS', badgeType: 'purple', sales: 0, icon: 'fas fa-mobile-alt', image: '' },
    { id: 5, name: 'Diamantes', description: 'Diamantes Free Fire baratos', category: 'Free Fire Diamantes', prices: [], priceFrom: 0, priceTo: 0, stock: 0, status: 'active', badge: 'PRÓXIMAMENTE', badgeType: 'warning', sales: 0, icon: 'fas fa-gem', image: '' },
  ];

  orders: any[] = [];

  notifications: any[] = [];

  get unreadNotifications(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  // ============ PAYMENT MODAL ============
  showPaymentModal = false;
  selectedProduct: any = null;
  selectedPlan: any = null;

  paymentMethods = [
    { id: 'paypal', name: 'PayPal', icon: 'fab fa-paypal', color: '#003087', description: 'Pago instantáneo con PayPal' },
    { id: 'binance', name: 'Binance Pay', icon: 'fas fa-coins', color: '#f0b90b', description: 'Paga con BNB, BTC, USDT y más' },
    { id: 'transferencia', name: 'Transferencia Bancaria', icon: 'fas fa-university', color: '#22d3ee', description: 'Transferencia o depósito directo' },
  ];

  selectedPaymentMethod: string = '';
  selectedCountry: string = '';
  latamCountries = [
    { code: 'MX', name: 'México', flag: '🇲🇽' },
    { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
    { code: 'BO', name: 'Bolivia', flag: '🇧🇴' },
    { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
    { code: 'CL', name: 'Chile', flag: '🇨🇱' },
    { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
    { code: 'CR', name: 'Costa Rica', flag: '🇨🇷' },
    { code: 'CU', name: 'Cuba', flag: '🇨🇺' },
    { code: 'EC', name: 'Ecuador', flag: '🇪🇨' },
    { code: 'SV', name: 'El Salvador', flag: '🇸🇻' },
    { code: 'GT', name: 'Guatemala', flag: '🇬🇹' },
    { code: 'HN', name: 'Honduras', flag: '🇭🇳' },
    { code: 'NI', name: 'Nicaragua', flag: '🇳🇮' },
    { code: 'PA', name: 'Panamá', flag: '🇵🇦' },
    { code: 'PY', name: 'Paraguay', flag: '🇵🇾' },
    { code: 'PE', name: 'Perú', flag: '🇵🇪' },
    { code: 'DO', name: 'República Dominicana', flag: '🇩🇴' },
    { code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
    { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
  ];

  bankDetails: Record<string, any> = {
    MX: { bank: 'Spin by OXXO', account: '4217470121417873', holder: 'Haide Ayala Zavala', clabe: '', note: 'Depósito en efectivo en cualquier OXXO' },
    AR: { bank: 'Mercado Pago', account: 'CBU/CVU en Discord', holder: 'Contactar en Discord', clabe: '', note: 'Envía el comprobante por Discord' },
    BO: { bank: 'Tigo Money / Unifacial', account: 'Contactar en Discord', holder: 'Contactar en Discord', clabe: '', note: 'Transferencia Tigo Money o depósito' },
    BR: { bank: 'PIX', account: 'Chave PIX en Discord', holder: 'Contactar en Discord', clabe: '', note: 'Pago instantáneo por PIX' },
    CL: { bank: 'Transferencia / Webpay', account: 'Contactar en Discord', holder: 'Contactar en Discord', clabe: '', note: 'Transferencia bancaria o pago online' },
    CO: { bank: 'Nequi / Daviplata', account: 'Enviar al número de Discord', holder: 'Contactar en Discord', clabe: '', note: 'Envía el comprobante por Discord' },
    CR: { bank: 'SINPE Móvil', account: 'Contactar en Discord', holder: 'Contactar en Discord', clabe: '', note: 'Transferencia SINPE Móvil' },
    CU: { bank: 'Transferencia MLC', account: 'Contactar en Discord', holder: 'Contactar en Discord', clabe: '', note: 'Transferencia en MLC o USD' },
    EC: { bank: 'Pago Móvil / Transferencia', account: 'Contactar en Discord', holder: 'Contactar en Discord', clabe: '', note: 'Transferencia bancaria' },
    SV: { bank: 'Tigo Money / Banco', account: 'Contactar en Discord', holder: 'Contactar en Discord', clabe: '', note: 'Transferencia o Tigo Money' },
    GT: { bank: 'Tigo Money / Banca en Línea', account: 'Contactar en Discord', holder: 'Contactar en Discord', clabe: '', note: 'Transferencia o Tigo Money' },
    HN: { bank: 'Tigo Money / Banpaís', account: 'Contactar en Discord', holder: 'Contactar en Discord', clabe: '', note: 'Transferencia o Tigo Money' },
    NI: { bank: 'Banpro / Pago Móvil', account: 'Contactar en Discord', holder: 'Contactar en Discord', clabe: '', note: 'Transferencia Banpro' },
    PA: { bank: 'Yappy / Nequi', account: 'Contactar en Discord', holder: 'Contactar en Discord', clabe: '', note: 'Transferencia Yappy o Nequi' },
    PY: { bank: 'Tigo Money / Bancard', account: 'Contactar en Discord', holder: 'Contactar en Discord', clabe: '', note: 'Transferencia Tigo Money' },
    PE: { bank: 'Yape / Plin', account: 'Enviar al número de Discord', holder: 'Contactar en Discord', clabe: '', note: 'Envía el comprobante por Discord' },
    DO: { bank: 'BanReservas / Link', account: 'Contactar en Discord', holder: 'Contactar en Discord', clabe: '', note: 'Transferencia bancaria o Link' },
    UY: { bank: 'Banco República / Abitab', account: 'Contactar en Discord', holder: 'Contactar en Discord', clabe: '', note: 'Transferencia o Abitab' },
    VE: { bank: 'Pago Móvil / Zelle', account: 'Contactar en Discord', holder: 'Contactar en Discord', clabe: '', note: 'Pago móvil o Zelle' },
    default: { bank: 'Transferencia Bancaria', account: 'Contactar en Discord para datos exactos', holder: 'Contactar en Discord', clabe: '', note: 'Escríbenos en Discord para recibir los datos de pago' },
  };

  // ============ PARTNER MODAL ============
  showPartnerModal = false;
  editingPartner: any = null;
  partnerForm = { name: '', email: '', password: '' };
  partnerError = '';
  partnerSuccess = '';
  showPartnerPass = false;
  partners: any[] = [];

  // ============ PRODUCT MODAL ============
  showProductModal = false;
  editingProduct: any = null;
  productForm: any = {
    name: '', description: '', category: 'Free Fire PC',
    prices: [{ duration: '1 Día', price: 0 }],
    stock: 999, badge: '', badgeType: 'info', icon: 'fas fa-box', image: ''
  };
  productImageFile: File | null = null;
  productImagePreview = '';
  isDragging = false;
  productError = '';
  productSuccess = '';
  productSaving = false;

  private userColors: Record<string, string> = {};
  private colorPalette = [
    '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c',
    '#3498db', '#9b59b6', '#e84393', '#00b894', '#6c5ce7',
    '#fd79a8', '#00cec9', '#a29bfe', '#ffeaa7', '#fab1a0',
    '#74b9ff', '#55efc4', '#ff7675', '#fdcb6e', '#a29bfe'
  ];

  constructor(
    private auth: AuthService,
    private router: Router,
    private api: ApiService,
    public panelState: PanelStateService,
  ) {}

  ngOnInit(): void {
    this.user = this.auth.user;
    if (this.isClient) {
      this.activeSection = 'tienda';
      this.panelState.setActiveSection('tienda');
      this.loadClientOrders();
    }
    this.loadProducts();
    this.loadNotifications();
    this.loadUserLocation();
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);
    if (!this.isClient) {
      this.loadPartners();
    }
    setTimeout(() => {
      this.loading = false;
    }, 1500);
  }

  ngOnDestroy(): void {
    if (this.clockInterval) clearInterval(this.clockInterval);
  }

  updateClock(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  loadUserLocation(): void {
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(data => {
        if (data.city && data.country_name) {
          this.userLocation = `${data.city}, ${data.country_name}`;
        }
      })
      .catch(() => {});
  }

  showSection(section: string): void {
    this.activeSection = section;
    this.panelState.setActiveSection(section);
    this.mobileMenuOpen = false;
  }

  get activeNavSections() {
    if (this.isClient) return this.clientNavSections;
    if (this.isSuperAdmin) return this.superAdminNavSections;
    return this.adminNavSections;
  }

  @HostListener('document:click')
  onDocumentClick(): void {}

  toggleSidebar(): void { this.sidebarCollapsed = !this.sidebarCollapsed; }
  toggleMobileMenu(): void { this.mobileMenuOpen = !this.mobileMenuOpen; }
  logout(): void { this.auth.logout(); }

  getUserColor(name: string): string {
    if (!name) return this.colorPalette[0];
    if (this.userColors[name]) return this.userColors[name];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % this.colorPalette.length;
    this.userColors[name] = this.colorPalette[idx];
    return this.userColors[name];
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

  loadClientOrders(): void {
    this.api.get<any>('cliente/orders').subscribe({
      next: (res) => { this.orders = res.data || []; },
      error: () => {}
    });
  }

  getTotalSpent(): number {
    return this.orders.reduce((sum: number, o: any) => sum + (o.amount || 0), 0);
  }

  getActiveOrders(): number {
    return this.orders.filter((o: any) => o.status === 'pending' || o.status === 'completed').length;
  }

  // ============ PAYMENT ============

  buyProduct(product: any): void {
    if (this.isGuest) { this.router.navigate(['/auth/login']); return; }
    this.selectedProduct = product;
    this.selectedPlan = null;
    this.showPaymentModal = true;
  }

  selectPlan(plan: any): void { this.selectedPlan = plan; }

  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.selectedProduct = null;
    this.selectedPlan = null;
    this.selectedPaymentMethod = '';
    this.selectedCountry = '';
  }

  selectPaymentMethod(methodId: string): void {
    if (methodId === 'transferencia') {
      this.selectedPaymentMethod = 'transferencia';
      return;
    }
    if (methodId === 'binance') {
      this.selectedPaymentMethod = 'binance';
      return;
    }
    this.processPayment(methodId);
  }

  confirmTransfer(): void {
    if (!this.selectedCountry) return;
    this.processPayment('transferencia');
  }

  confirmBinance(): void {
    this.processPayment('binance');
  }

  processPayment(methodId: string): void {
    if (!this.selectedProduct || !this.selectedPlan) return;

    const orderData = {
      productId: this.selectedProduct._id || this.selectedProduct.id,
      planDuration: this.selectedPlan.duration,
      amount: this.selectedPlan.price,
      method: methodId,
    };

    this.api.post<any>('orders', orderData).subscribe({
      next: () => {
        this.closePaymentModal();
      },
      error: () => {
        this.closePaymentModal();
      }
    });
  }

  getCountryBankDetails(): any {
    return this.bankDetails[this.selectedCountry] || this.bankDetails['default'];
  }

  // ============ PARTNER MODAL ============

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
    if (!name || !email) { this.partnerError = 'Nombre y email son requeridos'; return; }
    if (!this.editingPartner && !password) { this.partnerError = 'La contraseña es requerida'; return; }

    if (this.editingPartner) {
      const body: any = { name, email };
      if (password) body.password = password;
      this.api.put<any>(`admin/users/${this.editingPartner._id}`, body).subscribe({
        next: () => { this.partnerSuccess = 'Socio actualizado'; this.loadPartners(); setTimeout(() => this.closePartnerModal(), 1200); },
        error: (err) => this.partnerError = err.error?.message || 'Error al actualizar'
      });
    } else {
      this.api.post<any>('admin/users', { name, email, password, role: 'vendedor' }).subscribe({
        next: () => { this.partnerSuccess = 'Socio creado'; this.loadPartners(); setTimeout(() => this.closePartnerModal(), 1200); },
        error: (err) => { this.partnerError = err.error?.message || err.message || 'Error al crear socio'; }
      });
    }
  }

  loadPartners(): void {
    this.api.get<any>('admin/users').subscribe({
      next: (res) => { this.partners = (res.data || []).filter((u: any) => u._id !== this.user?.id && u.role !== 'cliente'); },
      error: () => {}
    });
  }

  loadNotifications(): void {
    this.api.get<any>('chat/notifications').subscribe({
      next: (res) => { this.notifications = res.data || []; },
      error: () => {}
    });
  }

  // ============ PRODUCT MODAL ============

  openProductModal(product?: any): void {
    this.productError = '';
    this.productSuccess = '';
    this.productImageFile = null;
    this.productImagePreview = '';
    if (product) {
      this.editingProduct = product;
      this.productForm = {
        name: product.name, description: product.description, category: product.category,
        prices: [...(product.prices || []).map((p: any) => ({ ...p }))],
        stock: product.stock ?? 999, badge: product.badge || '', badgeType: product.badgeType || 'info',
        icon: product.icon || 'fas fa-box', image: product.image || ''
      };
      this.productImagePreview = product.image ? (product.image.startsWith('/') ? this.imageUrl + product.image : product.image) : '';
    } else {
      this.editingProduct = null;
      this.productForm = {
        name: '', description: '', category: 'Free Fire PC',
        prices: [{ duration: '1 Día', price: 0 }],
        stock: 999, badge: '', badgeType: 'info', icon: 'fas fa-box', image: ''
      };
    }
    this.showProductModal = true;
  }

  closeProductModal(): void {
    this.showProductModal = false;
    this.editingProduct = null;
    this.productImageFile = null;
    this.productImagePreview = '';
    this.productError = '';
    this.productSuccess = '';
  }

  onProductImageSelect(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    this.processImageFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processImageFile(files[0]);
    }
  }

  private processImageFile(file: File): void {
    if (!file.type.startsWith('image/')) { this.productError = 'Solo se permiten archivos de imagen'; return; }
    if (file.size > 2 * 1024 * 1024) { this.productError = 'La imagen no puede superar 2MB'; return; }
    this.productImageFile = file;
    this.productError = '';
    const reader = new FileReader();
    reader.onload = () => { this.productImagePreview = reader.result as string; };
    reader.readAsDataURL(file);
  }

  removeProductImage(): void {
    this.productImageFile = null;
    this.productImagePreview = '';
    this.productForm.image = '';
  }

  addPriceRow(): void {
    this.productForm.prices.push({ duration: '', price: 0 });
  }

  removePriceRow(index: number): void {
    this.productForm.prices.splice(index, 1);
  }

  saveProduct(): void {
    this.productError = '';
    const { name, description, category } = this.productForm;
    if (!name || !description || !category) { this.productError = 'Nombre, descripción y categoría son requeridos'; return; }

    this.productSaving = true;
    const fd = new FormData();
    fd.append('name', name);
    fd.append('description', description);
    fd.append('category', category);
    fd.append('prices', JSON.stringify(this.productForm.prices));
    fd.append('stock', String(this.productForm.stock));
    fd.append('badge', this.productForm.badge);
    fd.append('badgeType', this.productForm.badgeType);
    fd.append('icon', this.productForm.icon);
    if (this.productImageFile) {
      fd.append('imageFile', this.productImageFile);
    } else if (!this.editingProduct && this.productForm.image) {
      fd.append('image', this.productForm.image);
    }

    const req = this.editingProduct
      ? this.api.put<any>(`products/${this.editingProduct._id || this.editingProduct.id}`, fd)
      : this.api.post<any>('products', fd);

    req.subscribe({
      next: () => {
        this.productSuccess = this.editingProduct ? 'Producto actualizado' : 'Producto creado';
        this.loadProducts();
        setTimeout(() => this.closeProductModal(), 1200);
        this.productSaving = false;
      },
      error: (err) => { this.productError = err.error?.message || 'Error al guardar producto'; this.productSaving = false; }
    });
  }

  deleteProduct(product: any): void {
    if (!confirm(`¿Eliminar "${product.name}"?`)) return;
    this.api.delete<any>(`products/${product._id || product.id}`).subscribe({
      next: () => this.loadProducts(),
      error: () => {}
    });
  }
}
