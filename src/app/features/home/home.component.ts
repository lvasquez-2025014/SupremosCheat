import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { ApiService } from '@core/services/api.service';
import { ChatService } from '@core/services/chat.service';
import { Chart, registerables } from 'chart.js';

import { environment } from '@env/environment';

Chart.register(...registerables);

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('revenueChart') revenueChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryChart') categoryChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('earningsChart') earningsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('analyticsVisits') analyticsVisitsRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('analyticsSales') analyticsSalesRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('analyticsConversion') analyticsConversionRef!: ElementRef<HTMLCanvasElement>;

  imageUrl = environment.apiUrl.replace(/\/api\/?$/, '');

  activeSection = 'dashboard';
  sidebarCollapsed = false;
  searchQuery = '';
  mobileMenuOpen = false;

  user: any = null;
  discordUrl = 'https://discord.gg/HazXhwWMS';
  todayDate = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  get isClient(): boolean { return this.user?.role === 'cliente'; }
  get isAdmin(): boolean { return this.user?.role === 'admin'; }
  get isVendor(): boolean { return this.user?.role === 'vendedor'; }
  get isGuest(): boolean { return !this.auth.isLoggedIn; }

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
    { name: 'Clientes', icon: 'fas fa-users', section: 'clientes' },
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
    { id: 1, name: 'Panel VIP PC', description: 'Panel completo para Free Fire en PC con ESP, Aimbot, Radar y más', category: 'Free Fire PC', prices: [{ duration: '1 Día', price: 1 }, { duration: '7 Días', price: 5 }, { duration: '14 Días', price: 10 }, { duration: '30 Días', price: 20 }, { duration: '90 Días', price: 30 }, { duration: '365 Días', price: 40 }], priceFrom: 1, priceTo: 40, stock: 999, status: 'active', badge: 'HOT', badgeType: 'danger', sales: 0, icon: 'fas fa-desktop', image: '' },
    { id: 2, name: 'Bypass APK', description: 'Bypass para detección APK en Free Fire', category: 'Free Fire Bypass', prices: [{ duration: '1 Día', price: 1 }, { duration: '7 Días', price: 4 }, { duration: '14 Días', price: 9 }, { duration: '30 Días', price: 12 }], priceFrom: 1, priceTo: 12, stock: 999, status: 'active', badge: 'VIP', badgeType: 'info', sales: 0, icon: 'fas fa-shield-alt', image: '' },
    { id: 3, name: 'Panel Proxy Android', description: 'Panel proxy para cuentas principales Android', category: 'Free Fire Proxy', prices: [{ duration: '1 Día', price: 2 }, { duration: '3 Días', price: 5 }, { duration: '7 Días', price: 11 }, { duration: '30 Días', price: 25 }], priceFrom: 2, priceTo: 25, stock: 999, status: 'active', badge: 'ANDROID', badgeType: 'success', sales: 0, icon: 'fas fa-mobile-alt', image: '' },
    { id: 4, name: 'Panel Proxy iOS', description: 'Panel proxy para cuentas principales iOS', category: 'Free Fire Proxy', prices: [{ duration: '1 Día', price: 2 }, { duration: '3 Días', price: 5 }, { duration: '7 Días', price: 11 }, { duration: '30 Días', price: 25 }], priceFrom: 2, priceTo: 25, stock: 999, status: 'active', badge: 'iOS', badgeType: 'purple', sales: 0, icon: 'fas fa-mobile-alt', image: '' },
    { id: 5, name: 'Diamantes', description: 'Diamantes Free Fire baratos', category: 'Free Fire Diamantes', prices: [], priceFrom: 0, priceTo: 0, stock: 0, status: 'active', badge: 'PRÓXIMAMENTE', badgeType: 'warning', sales: 0, icon: 'fas fa-gem', image: '' },
  ];

  orders: any[] = [];
  transactions: any[] = [];
  partners: any[] = [];
  clientes: any[] = [];

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
  showPartnerPass = false;

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

  showPaymentModal = false;
  selectedProduct: any = null;
  selectedPlan: any = null;

  // ============ DISCORD-STYLE CHAT STATE ============
  chatView: 'dms' | 'channels' = 'dms';
  chatConversations: any[] = [];
  chatChannels: any[] = [];
  activeChat: any = null;
  chatMessages: any[] = [];
  chatInput = '';
  chatLoading = false;
  chatUsers: any[] = [];
  showChatModal = false;
  chatAllConversations: any[] = [];
  chatSearchQuery = '';
  chatSearchInput = '';
  membersVisible = true;
  replyTo: any = null;
  showEmojiPicker = false;
  onlineUserIds: string[] = [];
  typingUsers: string[] = [];
  chatChannelsOpen = false;

  emojis = ['😀','😂','🔥','💯','❤️','👀','🎮','💎','👑','⚡','🚀','✅','❌','🎯','💪','🙏','😎','🤝','💥','⭐','🏆','🎁','💰','🔑','🛡️','⚔️','🎲','🌟','✨','💫'];

  apiNotifications: any[] = [];
  showNotifications = false;

  paymentMethods = [
    { id: 'paypal', name: 'PayPal', icon: 'fab fa-paypal', color: '#003087', description: 'Pago instantáneo con PayPal' },
    { id: 'binance', name: 'Binance Pay', icon: 'fas fa-coins', color: '#f0b90b', description: 'Paga con BNB, BTC, USDT y más' },
    { id: 'transferencia', name: 'Transferencia Bancaria', icon: 'fas fa-university', color: '#22d3ee', description: 'Transferencia o depósito directo' },
  ];

  private heartbeatInterval: any;
  private refreshInterval: any;
  private msgPollInterval: any;

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
      this.loadClientes();
    }

    // Heartbeat every 30s - refreshes token to keep session alive
    this.heartbeatInterval = setInterval(() => {
      if (this.auth.isLoggedIn) {
        this.chatService.sendHeartbeat().subscribe({
          next: (res) => {
            if (res.token) {
              localStorage.setItem('token', res.token);
            }
          },
          error: () => {}
        });
      }
    }, 30000);

    // Refresh conversations every 5s
    this.refreshInterval = setInterval(() => {
      if (this.activeSection === 'chat') {
        this.loadChat();
      }
    }, 5000);

    // Poll messages every 2s when a chat is active
    this.msgPollInterval = setInterval(() => {
      if (this.activeSection === 'chat' && this.activeChat) {
        this.refreshMessages();
      }
    }, 2000);
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initCharts(), 100);
  }

  ngOnDestroy(): void {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    if (this.msgPollInterval) clearInterval(this.msgPollInterval);
    this.destroyCharts();
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

  toggleSidebar(): void { this.sidebarCollapsed = !this.sidebarCollapsed; }
  toggleMobileMenu(): void { this.mobileMenuOpen = !this.mobileMenuOpen; }
  logout(): void { this.auth.logout(); }

  get unreadNotifications(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  get totalRevenue(): number {
    return this.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  }

  get totalExpenses(): number {
    return Math.abs(this.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0));
  }

  loadPartners(): void {
    this.api.get<any>('admin/users').subscribe({
      next: (res) => { this.partners = (res.data || []).filter((u: any) => u._id !== this.user?.id && u.role !== 'cliente'); },
      error: () => {}
    });
  }

  loadClientes(): void {
    this.api.get<any>('admin/users').subscribe({
      next: (res) => { this.clientes = (res.data || []).filter((u: any) => u.role === 'cliente'); },
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

  // ============ CHAT METHODS ============

  loadChat(): void {
    this.chatService.getConversations().subscribe({
      next: (res) => {
        if (res.data) {
          this.chatAllConversations = res.data;
          this.chatChannels = res.data.filter((c: any) => c.type === 'channel');
          this.chatConversations = res.data.filter((c: any) => c.type !== 'channel');
          if (!this.activeChat && this.chatConversations.length > 0) {
            // Auto-select first DM
          }
        }
      },
      error: () => {}
    });
  }

  refreshMessages(): void {
    if (!this.activeChat) return;
    this.chatService.getMessages(this.activeChat._id).subscribe({
      next: (res) => {
        if (res.data) {
          this.chatMessages = res.data;
        }
      },
      error: () => {}
    });
  }

  switchChatView(view: 'dms' | 'channels'): void {
    this.chatView = view;
    this.activeChat = null;
    this.chatMessages = [];
    this.replyTo = null;
  }

  selectConversation(conv: any): void {
    this.activeChat = conv;
    this.chatMessages = [];
    this.chatLoading = true;
    this.replyTo = null;
    this.chatService.getMessages(conv._id).subscribe({
      next: (res) => {
        this.chatMessages = res.data || [];
        this.chatLoading = false;
        this.chatService.markAsRead(conv._id).subscribe();
        this.scrollToBottom();
      },
      error: () => { this.chatLoading = false; }
    });
  }

  selectChannel(ch: any): void {
    this.activeChat = ch;
    this.chatMessages = [];
    this.chatLoading = true;
    this.replyTo = null;
    this.chatService.getMessages(ch._id).subscribe({
      next: (res) => {
        this.chatMessages = res.data || [];
        this.chatLoading = false;
        this.chatService.markAsRead(ch._id).subscribe();
        this.scrollToBottom();
      },
      error: () => { this.chatLoading = false; }
    });
  }

  sendChatMessage(): void {
    if (!this.chatInput.trim() || !this.activeChat) return;
    const content = this.chatInput.trim();
    const replyId = this.replyTo?._id || null;
    this.chatInput = '';
    this.replyTo = null;

    this.chatService.sendMessage(this.activeChat._id, content, 'text', replyId).subscribe({
      next: (res) => {
        if (res.data) {
          this.chatMessages.push(res.data);
          this.scrollToBottom();
        }
      },
      error: () => {}
    });
  }

  handleChatKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendChatMessage();
    }
  }

  autoResize(event: any): void {
    const textarea = event.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
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
          this.chatView = 'dms';
          setTimeout(() => {
            const conv = this.chatAllConversations.find((c: any) => c._id === res.data._id);
            if (conv) this.selectConversation(conv);
            else this.selectConversation(res.data);
          }, 300);
        }
      },
      error: () => {}
    });
  }

  deleteMessage(msg: any): void {
    if (!this.activeChat) return;
    this.chatService.deleteMessage(this.activeChat._id, msg._id).subscribe({
      next: () => {
        msg.isDeleted = true;
        msg.content = 'Mensaje eliminado';
      },
      error: () => {}
    });
  }

  toggleReaction(msg: any, emoji: string): void {
    this.chatService.addReaction(msg._id, emoji).subscribe({
      next: (res) => {
        if (res.data) {
          const idx = this.chatMessages.findIndex((m: any) => m._id === msg._id);
          if (idx >= 0) this.chatMessages[idx] = res.data;
        }
      },
      error: () => {}
    });
  }

  setReplyTo(msg: any): void {
    this.replyTo = msg;
  }

  cancelReply(): void {
    this.replyTo = null;
  }

  togglePinMessage(msg: any): void {
    this.chatService.togglePin(msg._id).subscribe({
      next: (res) => {
        msg.isPinned = res.data?.isPinned;
      },
      error: () => {}
    });
  }

  copyMessageText(msg: any): void {
    navigator.clipboard.writeText(msg.content);
  }

  toggleEmojiPickerFn(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  insertEmoji(emoji: string): void {
    this.chatInput += emoji;
    this.showEmojiPicker = false;
  }

  toggleMembers(): void {
    this.membersVisible = !this.membersVisible;
  }

  toggleChatChannels(): void {
    this.chatChannelsOpen = !this.chatChannelsOpen;
  }

  filterConversations(): void {
    const q = this.chatSearchInput.toLowerCase();
    if (!q) {
      this.chatConversations = this.chatAllConversations.filter((c: any) => c.type !== 'channel');
      return;
    }
    this.chatConversations = this.chatAllConversations.filter((c: any) => {
      if (c.type === 'channel') return false;
      const name = c.name || '';
      return name.toLowerCase().includes(q);
    });
  }

  scrollToBottom(): void {
    setTimeout(() => {
      const el = document.getElementById('chatMessagesContainer');
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }

  // ============ CHAT HELPERS ============

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(w => w.charAt(0)).join('').substring(0, 2).toUpperCase();
  }

  getGradient(role: string, senderName?: string): string {
    if (senderName === 'Admin Root' || role === 'admin') return 'from-red-500 via-pink-500 to-purple-500';
    if (role === 'vendedor') return 'from-cyan-500 to-blue-500';
    return 'from-lime-500 to-green-500';
  }

  getRoleBadgeClass(role: string): string {
    if (role === 'admin') return 'badge-admin';
    if (role === 'vendedor') return 'badge-vendor';
    return 'badge-client';
  }

  getRoleLabel(role: string): string {
    if (role === 'admin') return 'ADMIN';
    if (role === 'vendedor') return 'VENDEDOR';
    return 'CLIENTE';
  }

  getTextColor(role: string, senderName?: string): string {
    if (senderName === 'Admin Root' || role === 'admin') return 'text-pink-400';
    if (role === 'vendedor') return 'text-cyan-400';
    return 'text-lime-400';
  }

  getOtherMember(conv: any): any {
    if (!conv?.memberDetails) return null;
    return conv.memberDetails.find((m: any) => m._id !== this.user?.id) || conv.memberDetails[0];
  }

  isCurrentUser(sender: any): boolean {
    return sender?._id === this.user?.id || sender?.name === this.user?.name;
  }

  isOnline(userId: string): boolean {
    return this.onlineUserIds.includes(userId);
  }

  getChannelMembers(): any[] {
    if (!this.chatAllConversations) return [];
    const seen = new Set<string>();
    const members: any[] = [];
    this.chatAllConversations.forEach((c: any) => {
      (c.memberDetails || []).forEach((m: any) => {
        if (m._id !== this.user?.id && !seen.has(m._id)) {
          seen.add(m._id);
          members.push(m);
        }
      });
    });
    return members;
  }

  get unreadNotifCount(): number {
    return this.apiNotifications.filter((n: any) => !n.isRead).length;
  }

  // ============ NOTIFICATIONS ============

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

  deletePartner(partner: any): void {
    if (!confirm(`¿Eliminar a ${partner.name}?`)) return;
    this.api.delete<any>(`admin/users/${partner._id}`).subscribe({
      next: () => this.loadPartners(),
      error: () => {}
    });
  }

  changeRole(partner: any, newRole: string): void {
    this.api.put<any>(`admin/users/${partner._id}/role`, { role: newRole }).subscribe({
      next: () => { partner.role = newRole; },
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
  }

  processPayment(methodId: string): void {
    if (!this.selectedProduct || !this.selectedPlan) return;
    if (methodId === 'transferencia') { window.open(this.discordUrl, '_blank'); this.closePaymentModal(); return; }
    if (methodId === 'paypal') { window.open(`https://paypal.me/SupremoCheats/${this.selectedPlan.price}USD`, '_blank'); this.closePaymentModal(); return; }
    if (methodId === 'binance') { window.open(this.discordUrl, '_blank'); this.closePaymentModal(); return; }
  }

  // ============ CHARTS ============

  private charts: Chart[] = [];

  private initCharts(): void {
    this.destroyCharts();
    if (this.activeSection === 'dashboard') { this.initRevenueChart(); this.initCategoryChart(); }
    else if (this.activeSection === 'ganancias') { this.initEarningsChart(); }
    else if (this.activeSection === 'analytics') { this.initAnalyticsCharts(); }
  }

  private destroyCharts(): void { this.charts.forEach(c => c.destroy()); this.charts = []; }

  private initRevenueChart(): void {
    if (!this.revenueChartRef) return;
    const ctx = this.revenueChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    this.charts.push(new Chart(ctx, {
      type: 'line',
      data: { labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'], datasets: [{ label: 'Ingresos', data: [0, 0, 0, 0, 0, 0], borderColor: '#22d3ee', backgroundColor: 'rgba(34, 211, 238, 0.1)', fill: true, tension: 0.4, pointBackgroundColor: '#22d3ee', pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 5 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(26, 26, 31, 0.9)', titleColor: '#22d3ee', bodyColor: '#fff', borderColor: '#22d3ee', borderWidth: 1 } }, scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } }, y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af', callback: (v: any) => '$' + v.toLocaleString() } } } }
    }));
  }

  private initCategoryChart(): void {
    if (!this.categoryChartRef) return;
    const ctx = this.categoryChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    this.charts.push(new Chart(ctx, {
      type: 'doughnut',
      data: { labels: ['Panel VIP PC', 'Bypass APK', 'Panel Proxy Android', 'Panel Proxy iOS', 'Diamantes'], datasets: [{ data: [0, 0, 0, 0, 0], backgroundColor: ['#22d3ee', '#f472b6', '#84cc16', '#a78bfa', '#fbbf24'], borderColor: '#1a1a1f', borderWidth: 3 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { color: '#9ca3af', padding: 20, usePointStyle: true } } } }
    }));
  }

  private initEarningsChart(): void {
    if (!this.earningsChartRef) return;
    const ctx = this.earningsChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    this.charts.push(new Chart(ctx, {
      type: 'bar',
      data: { labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'], datasets: [{ label: 'Ganancias', data: [0, 0, 0, 0, 0, 0, 0], backgroundColor: 'rgba(34, 211, 238, 0.6)', borderColor: '#22d3ee', borderWidth: 1, borderRadius: 6 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } }, y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af', callback: (v: any) => '$' + v.toLocaleString() } } } }
    }));
  }

  private initAnalyticsCharts(): void {
    if (this.analyticsVisitsRef) {
      const ctx1 = this.analyticsVisitsRef.nativeElement.getContext('2d');
      if (ctx1) {
        this.charts.push(new Chart(ctx1, {
          type: 'line', data: { labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'], datasets: [{ label: 'Visitas', data: [0, 0, 0, 0, 0, 0, 0], borderColor: '#22d3ee', backgroundColor: 'rgba(34, 211, 238, 0.1)', fill: true, tension: 0.4 }] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } }, y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } } } }
        }));
      }
    }
    if (this.analyticsSalesRef) {
      const ctx2 = this.analyticsSalesRef.nativeElement.getContext('2d');
      if (ctx2) {
        this.charts.push(new Chart(ctx2, {
          type: 'bar', data: { labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'], datasets: [{ label: 'Ventas', data: [0, 0, 0, 0, 0, 0, 0], backgroundColor: 'rgba(244, 114, 182, 0.6)', borderColor: '#f472b6', borderWidth: 1, borderRadius: 6 }] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } }, y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } } } }
        }));
      }
    }
    if (this.analyticsConversionRef) {
      const ctx3 = this.analyticsConversionRef.nativeElement.getContext('2d');
      if (ctx3) {
        this.charts.push(new Chart(ctx3, {
          type: 'doughnut', data: { labels: ['Convertidos', 'Abandonados', 'Pendientes'], datasets: [{ data: [0, 0, 100], backgroundColor: ['#84cc16', '#ef4444', '#a78bfa'], borderColor: '#1a1a1f', borderWidth: 3 }] },
          options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { color: '#9ca3af', padding: 20, usePointStyle: true } } } }
        }));
      }
    }
  }
}
