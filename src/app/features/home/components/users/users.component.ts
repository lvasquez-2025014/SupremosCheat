import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { ApiService } from '@core/services/api.service';
import { PanelStateService } from '@core/services/panel-state.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit, OnDestroy {
  user: any = null;
  isAdmin = false;
  isVendor = false;

  partners: any[] = [];
  clientes: any[] = [];
  allUsers: any[] = [];

  usSearchQuery = '';
  filteredUsersList: any[] = [];

  showAddUserModal = false;
  usNewName = '';
  usNewEmail = '';
  usNewPassword = '';
  usNewRole = 'vendedor';
  usSaving = false;
  usErrors: any = {};
  usDropdownOpen: string | null = null;
  usModalShake = false;
  showConfirmDelete = false;
  usUserToDelete: any = null;

  usToasts: any[] = [];
  private usToastId = 0;
  private usSubtitleInterval: any;
  subtitleAnimState: 'visible' | 'exit' | 'enter' = 'visible';
  currentSubtitle = 'Gestiona los usuarios del panel';
  titleChars: string[] = [];
  private usSubtitleMessages = [
    'Gestiona los usuarios del panel',
    'Administra roles y permisos',
    'Control total de tu equipo',
    'Monitorea la actividad en tiempo real',
    'Agrega, edita y elimina usuarios',
    'Panel de administración avanzado',
    'Seguridad y accesos centralizados'
  ];
  private usSubIdx = 0;

  sociosSearchQuery = '';
  sociosTitleChars: string[] = [];
  private sociosSubtitleInterval: any;
  sociosSubtitleAnimState: 'visible' | 'exit' | 'enter' = 'visible';
  sociosCurrentSubtitle = 'Gestiona los vendedores del panel';
  private sociosSubtitleMessages = [
    'Gestiona los vendedores del panel',
    'Administra roles de vendedores',
    'Control total de acceso',
    'Monitorea la actividad en tiempo real',
    'Agrega, edita y elimina vendedores',
    'Panel de vendedores avanzado',
    'Seguridad y accesos centralizados'
  ];
  private sociosSubIdx = 0;

  get filteredSocios(): any[] {
    const base = this.partners.filter(u => String(u.role) === 'vendedor');
    const q = this.sociosSearchQuery.toLowerCase().trim();
    if (!q) return base;
    return base.filter(u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
  }

  get sociosVendorCount(): number { return this.partners.filter(u => String(u.role) === 'vendedor').length; }

  showPartnerModal = false;
  editingPartner: any = null;
  partnerForm = { name: '', email: '', password: '' };
  partnerError = '';
  partnerSuccess = '';

  loading = true;

  get usAdminCount(): number { return this.allUsers.filter(u => u.role === 'admin').length; }
  get usVendorCount(): number { return this.allUsers.filter(u => u.role === 'vendedor').length; }
  get usClientCount(): number { return this.allUsers.filter(u => u.role === 'cliente').length; }

  get filteredUsers(): any[] {
    const q = this.usSearchQuery.toLowerCase().trim();
    if (!q) return this.allUsers;
    return this.allUsers.filter(u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
  }

  constructor(
    private auth: AuthService,
    private api: ApiService,
    public panelState: PanelStateService
  ) {}

  ngOnInit(): void {
    this.user = this.auth.user;
    this.isAdmin = this.user?.role === 'admin';
    this.isVendor = this.user?.role === 'vendedor';
    this.titleChars = 'Usuarios'.split('');
    this.sociosTitleChars = 'Socios'.split('');

    if (this.isAdmin) {
      this.loadPartners();
      this.loadClientes();
    }
    this.loadUsers();
    this.initUsSubtitleRotation();
    this.initSociosSubtitleRotation();

    setTimeout(() => {
      this.loading = false;
    }, 500);
  }

  ngOnDestroy(): void {
    if (this.usSubtitleInterval) clearInterval(this.usSubtitleInterval);
    if (this.sociosSubtitleInterval) clearInterval(this.sociosSubtitleInterval);
  }

  loadPartners(): void {
    this.api.get<any>('admin/users').subscribe({
      next: (res) => {
        const userId = String(this.user?.id || this.user?._id || '');
        this.partners = (res.data || []).filter((u: any) => {
          const isSelf = String(u._id || u.id) === userId;
          return !isSelf && u.role !== 'cliente';
        });
      },
      error: (err) => { console.error('[UsersComponent] Error loading partners:', err); }
    });
  }

  loadClientes(): void {
    this.api.get<any>('admin/users').subscribe({
      next: (res) => { this.clientes = (res.data || []).filter((u: any) => u.role === 'cliente'); },
      error: (err) => { console.error('[UsersComponent] Error loading clientes:', err); }
    });
  }

  loadUsers(): void {
    this.api.get<any>('admin/users').subscribe({
      next: (res) => { this.allUsers = (res.data || []); },
      error: (err) => { console.error('[UsersComponent] Error loading users:', err); }
    });
  }

  getAvatarGradient(index: number): string {
    const grads = ['us-avatar-g1', 'us-avatar-g2', 'us-avatar-g3', 'us-avatar-g4', 'us-avatar-g5'];
    return grads[index % grads.length];
  }

  openAddUserModal(): void {
    this.showAddUserModal = true;
    this.usNewName = '';
    this.usNewEmail = '';
    this.usNewPassword = '';
    this.usNewRole = 'vendedor';
    this.usErrors = {};
    this.usModalShake = false;
  }

  closeAddUserModal(): void {
    this.showAddUserModal = false;
    this.usErrors = {};
    this.usModalShake = false;
  }

  addUser(): void {
    const name = this.usNewName.trim();
    const email = this.usNewEmail.trim();
    const password = this.usNewPassword.trim();
    this.usErrors = {};
    let hasError = false;

    if (!name) { this.usErrors.name = true; hasError = true; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { this.usErrors.email = true; hasError = true; }
    if (!password || password.length < 6) { this.usErrors.password = true; hasError = true; }

    if (hasError) {
      this.usModalShake = true;
      setTimeout(() => this.usModalShake = false, 400);
      return;
    }

    this.usSaving = true;
    this.api.post<any>('admin/users', { name, email, password, role: this.usNewRole }).subscribe({
      next: (res) => {
        this.usSaving = false;
        this.loadUsers();
        this.closeAddUserModal();
        this.showUsToast(`Usuario "${name}" agregado correctamente`, 'success');
      },
      error: (err) => {
        this.usSaving = false;
        const msg = err?.error?.message || 'Error al crear usuario';
        this.showUsToast(msg, 'error');
        this.usModalShake = true;
        setTimeout(() => this.usModalShake = false, 400);
      }
    });
  }

  changeUserRole(user: any, newRole: string): void {
    if (user.role === newRole) { this.usDropdownOpen = null; return; }
    this.api.put<any>(`admin/users/${user._id}/role`, { role: newRole }).subscribe({
      next: () => {
        user.role = newRole;
        this.usDropdownOpen = null;
        this.showUsToast(`Rol actualizado a "${this.getRoleLabel(newRole)}"`, 'info');
      },
      error: (err) => {
        this.usDropdownOpen = null;
        this.showUsToast(err?.error?.message || 'Error al actualizar rol', 'error');
      }
    });
  }

  toggleUserDropdown(userId: string): void {
    this.usDropdownOpen = this.usDropdownOpen === userId ? null : userId;
  }

  confirmDeleteUser(user: any): void {
    this.usUserToDelete = user;
    this.showConfirmDelete = true;
  }

  cancelDelete(): void {
    this.usUserToDelete = null;
    this.showConfirmDelete = false;
  }

  executeDeleteUser(): void {
    if (!this.usUserToDelete) return;
    const user = this.usUserToDelete;
    const name = user.name;
    this.api.delete<any>(`admin/users/${user._id}`).subscribe({
      next: () => {
        this.allUsers = this.allUsers.filter(u => u._id !== user._id);
        this.showConfirmDelete = false;
        this.usUserToDelete = null;
        this.showUsToast(`Usuario "${name}" eliminado`, 'error');
      },
      error: (err) => {
        this.showConfirmDelete = false;
        this.usUserToDelete = null;
        this.showUsToast(err?.error?.message || 'Error al eliminar usuario', 'error');
      }
    });
  }

  onUsSearch(): void { }

  trackByUserId(_index: number, user: any): string { return user._id; }

  trackByToastId(_index: number, t: any): number { return t.id; }

  onUsCardMove(event: MouseEvent, index: number): void {
    const cards = document.querySelectorAll('.us-card');
    if (cards[index]) {
      const rect = cards[index].getBoundingClientRect();
      (cards[index] as HTMLElement).style.setProperty('--mouse-x', ((event.clientX - rect.left) / rect.width) * 100 + '%');
      (cards[index] as HTMLElement).style.setProperty('--mouse-y', ((event.clientY - rect.top) / rect.height) * 100 + '%');
    }
  }

  showUsToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const id = ++this.usToastId;
    this.usToasts.push({ id, message, type, _removing: false });
    setTimeout(() => {
      const t = this.usToasts.find(x => x.id === id);
      if (t) t._removing = true;
      setTimeout(() => { this.usToasts = this.usToasts.filter(x => x.id !== id); }, 300);
    }, 3000);
  }

  private initUsSubtitleRotation(): void {
    this.usSubtitleInterval = setInterval(() => {
      this.subtitleAnimState = 'exit';
      setTimeout(() => {
        this.usSubIdx = (this.usSubIdx + 1) % this.usSubtitleMessages.length;
        this.currentSubtitle = this.usSubtitleMessages[this.usSubIdx];
        this.subtitleAnimState = 'enter';
        setTimeout(() => {
          this.subtitleAnimState = 'visible';
        }, 50);
      }, 500);
    }, 4000);
  }

  private initSociosSubtitleRotation(): void {
    this.sociosSubtitleInterval = setInterval(() => {
      this.sociosSubtitleAnimState = 'exit';
      setTimeout(() => {
        this.sociosSubIdx = (this.sociosSubIdx + 1) % this.sociosSubtitleMessages.length;
        this.sociosCurrentSubtitle = this.sociosSubtitleMessages[this.sociosSubIdx];
        this.sociosSubtitleAnimState = 'enter';
        setTimeout(() => {
          this.sociosSubtitleAnimState = 'visible';
        }, 50);
      }, 500);
    }, 4000);
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  private userColors: Record<string, string> = {};
  private colorPalette = [
    '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c',
    '#3498db', '#9b59b6', '#e84393', '#00b894', '#6c5ce7',
    '#fd79a8', '#00cec9', '#a29bfe', '#ffeaa7', '#fab1a0',
    '#74b9ff', '#55efc4', '#ff7675', '#fdcb6e', '#a29bfe'
  ];

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

  getRoleLabel(role: string): string {
    if (role === 'admin') return 'ADMIN';
    if (role === 'vendedor') return 'VENDEDOR';
    return 'CLIENTE';
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
    const prevRole = partner.role;
    this.api.put<any>(`admin/users/${partner._id}/role`, { role: newRole }).subscribe({
      next: (res) => { partner.role = newRole; },
      error: (err) => {
        console.error('[changeRole] Error:', err);
        partner.role = prevRole;
      }
    });
  }

  viewUserProfileById(userId: string): void {
    this.api.get<any>(`profile/${userId}`).subscribe({
      next: (res) => {
        this.viewUserProfile = res.data;
      },
      error: (err) => {
        console.error('Error loading profile:', err);
        this.showUsToast('Error al cargar el perfil', 'error');
      }
    });
  }

  viewUserProfile: any = null;

  closeUserProfile(): void {
    this.viewUserProfile = null;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.usDropdownOpen = null;
  }
}
