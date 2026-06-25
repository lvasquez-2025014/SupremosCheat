import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { ApiService } from '@core/services/api.service';
import { AuthService } from '@core/services/auth.service';
import { PanelStateService } from '@core/services/panel-state.service';

interface CmdLine {
  text: string;
  type: 'input' | 'output' | 'error' | 'system' | 'success';
  timestamp: Date;
}

@Component({
  selector: 'app-cmd',
  templateUrl: './cmd.component.html',
  styleUrls: ['./cmd.component.scss']
})
export class CmdComponent implements OnInit, AfterViewChecked {
  @ViewChild('cmdOutput') cmdOutputRef!: ElementRef;
  @ViewChild('cmdInput') cmdInputRef!: ElementRef;

  lines: CmdLine[] = [];
  currentInput = '';
  commandHistory: string[] = [];
  historyIndex = -1;
  isExecuting = false;
  showCursor = true;
  isSuperAdmin = false;
  currentTimeStr = '';
  private wasAtBottom = true;

  private cursorInterval: any;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    public panelState: PanelStateService
  ) {}

  ngOnInit(): void {
    const user = this.auth.user;
    this.isSuperAdmin = user?.role === 'superadmin';
    this.pushLine('╔══════════════════════════════════════════╗', 'system');
    this.pushLine('║   Asmodeus Developer - Terminal v1.0.0   ║', 'system');
    this.pushLine('║   Escribe "help" para ver comandos       ║', 'system');
    this.pushLine('╚══════════════════════════════════════════╝\n', 'system');
    this.cursorInterval = setInterval(() => {
      this.showCursor = !this.showCursor;
      this.updateTime();
    }, 530);
    this.updateTime();
  }

  ngOnDestroy(): void {
    if (this.cursorInterval) clearInterval(this.cursorInterval);
  }

  ngAfterViewChecked(): void {
    if (this.wasAtBottom) {
      this.scrollToBottom();
    }
  }

  scrollToBottom(): void {
    if (this.cmdOutputRef?.nativeElement) {
      const el = this.cmdOutputRef.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  onBodyScroll(): void {
    if (!this.cmdOutputRef?.nativeElement) return;
    const el = this.cmdOutputRef.nativeElement;
    this.wasAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
  }

  focusInput(): void {
    this.cmdInputRef?.nativeElement?.focus();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.executeCommand();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.navigateHistory(-1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.navigateHistory(1);
    } else if (event.key === 'l' && event.ctrlKey) {
      event.preventDefault();
      this.lines = [];
      this.wasAtBottom = true;
      this.pushLine('Terminal limpiada.\n', 'system');
    }
  }

  navigateHistory(direction: number): void {
    if (this.commandHistory.length === 0) return;
    this.historyIndex += direction;
    if (this.historyIndex < -1) this.historyIndex = -1;
    if (this.historyIndex >= this.commandHistory.length) {
      this.historyIndex = this.commandHistory.length - 1;
    }
    this.currentInput = this.historyIndex >= 0
      ? this.commandHistory[this.commandHistory.length - 1 - this.historyIndex]
      : '';
  }

  executeCommand(): void {
    const cmd = this.currentInput.trim();
    this.pushLine(`> ${this.currentInput}`, 'input');
    this.currentInput = '';
    this.historyIndex = -1;

    if (!cmd) return;

    this.commandHistory.push(cmd);

    const parts = cmd.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (command) {
      case 'help': this.cmdHelp(); break;
      case 'clear': case 'cls': this.lines = []; this.wasAtBottom = true; break;
      case 'whoami': this.cmdWhoami(); break;
      case 'date': this.pushLine(new Date().toLocaleString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }), 'output'); break;
      case 'echo': this.pushLine(args.join(' ') || '', 'output'); break;
      case 'version': this.cmdVersion(); break;
      case 'users': this.cmdUsers(); break;
      case 'user': this.cmdFindUser(args); break;
      case 'stats': this.cmdStats(); break;
      case 'products': this.cmdProducts(); break;
      case 'orders': this.cmdOrders(args); break;
      case 'set-role': this.cmdSetRole(args); break;
      case 'ban': this.cmdBan(args); break;
      case 'unban': this.cmdUnban(args); break;
      case 'delete': this.cmdDeleteUser(args); break;
      case 'server': this.cmdServer(); break;
      case 'history': this.cmdHistory(); break;
      case 'uptime': this.cmdUptime(); break;
      case 'env': this.cmdEnv(); break;
      case 'banner': this.cmdBanner(); break;
      default:
        this.pushLine(`Comando no encontrado: "${command}". Escribe "help" para ver comandos.`, 'error');
    }
    this.pushLine('', 'output');
    this.wasAtBottom = true;
    setTimeout(() => this.focusInput(), 50);
  }

  private pushLine(text: string, type: CmdLine['type']): void {
    this.lines.push({ text, type, timestamp: new Date() });
  }

  private cmdHelp(): void {
    const lines = [
      '┌─ COMANDOS DISPONIBLES ─────────────────────────────┐',
      '│                                                     │',
      '│  SISTEMA                                            │',
      '│    help          Muestra esta ayuda                 │',
      '│    clear         Limpia la terminal                 │',
      '│    version       Versión del sistema                │',
      '│    server        Estado del servidor backend        │',
      '│    uptime        Tiempo activo del servidor         │',
      '│    env           Variables de entorno                │',
      '│    date          Fecha y hora actual                │',
      '│    banner        Muestra el banner de inicio        │',
      '│                                                     │',
      '│  USUARIOS                                           │',
      '│    whoami        Info del usuario actual            │',
      '│    users         Lista todos los usuarios           │',
      '│    user [name]   Buscar usuario por nombre          │',
      '│    set-role [id] [role]  Cambiar rol de usuario     │',
      '│    ban [email]   Desactivar usuario                 │',
      '│    unban [email] Activar usuario                    │',
      '│    delete [id]   Eliminar usuario                   │',
      '│                                                     │',
      '│  NEGOCIO                                            │',
      '│    products      Lista productos                    │',
      '│    orders        Lista pedidos recientes            │',
      '│    stats         Estadísticas del panel             │',
      '│                                                     │',
      '│  UTILIDADES                                         │',
      '│    echo [text]   Imprime texto                      │',
      '│    history       Historial de comandos              │',
      '│                                                     │',
      '│  ATAJOS: ↑↓ historial │ Ctrl+L limpiar             │',
      '└─────────────────────────────────────────────────────┘',
    ];
    lines.forEach(l => this.pushLine(l, 'output'));
  }

  private cmdWhoami(): void {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      this.pushLine('┌─ USUARIO ACTUAL ──────────────┐', 'output');
      this.pushLine(`│  Nombre:  ${user.name || 'N/A'}`, 'output');
      this.pushLine(`│  Email:   ${user.email || 'N/A'}`, 'output');
      this.pushLine(`│  Rol:     ${(user.role || 'N/A').toUpperCase()}`, 'output');
      this.pushLine(`│  ID:      ${user.id || user._id || 'N/A'}`, 'output');
      this.pushLine('└───────────────────────────────┘', 'output');
    } catch {
      this.pushLine('No se pudo obtener la información del usuario.', 'error');
    }
  }

  private cmdVersion(): void {
    this.pushLine('┌─ SISTEMA ─────────────────────────────────┐', 'output');
    this.pushLine('│  Asmodeus Developer Panel    v1.0.0            │', 'output');
    this.pushLine('│  Frontend                Angular 15        │', 'output');
    this.pushLine('│  Backend                 Express + Mongoose│', 'output');
    this.pushLine('│  Base de datos           MongoDB Atlas     │', 'output');
    this.pushLine('│  Deploy                  Render + Vercel   │', 'output');
    this.pushLine('└────────────────────────────────────────────┘', 'output');
  }

  private cmdUsers(): void {
    this.isExecuting = true;
    this.pushLine('Cargando usuarios...', 'system');
    this.api.get<any>('admin/users').subscribe({
      next: (res) => {
        const users = res.data || [];
        this.pushLine(`Total: ${users.length} usuarios\n`, 'output');
        const roleColors: Record<string, string> = { superadmin: 'SUPERADMIN', admin: 'ADMIN     ', cliente: 'CLIENTE   ' };
        users.forEach((u: any) => {
          const role = roleColors[u.role] || u.role.toUpperCase().padEnd(10);
          this.pushLine(`  [${role}] ${u.name} <${u.email}>`, 'output');
        });
        this.isExecuting = false;
      },
      error: () => { this.pushLine('Error al cargar usuarios.', 'error'); this.isExecuting = false; }
    });
  }

  private cmdFindUser(args: string[]): void {
    if (!args.length) { this.pushLine('Uso: user [nombre]', 'error'); return; }
    const query = args.join(' ').toLowerCase();
    this.isExecuting = true;
    this.api.get<any>('admin/users').subscribe({
      next: (res) => {
        const users = (res.data || []).filter((u: any) =>
          u.name?.toLowerCase().includes(query) || u.email?.toLowerCase().includes(query)
        );
        if (users.length === 0) { this.pushLine('No se encontraron usuarios.', 'error'); this.isExecuting = false; return; }
        users.forEach((u: any) => {
          this.pushLine(`  ${u.name} <${u.email}> [${u.role.toUpperCase()}] ID: ${u._id}`, 'output');
        });
        this.isExecuting = false;
      },
      error: () => { this.pushLine('Error al buscar usuarios.', 'error'); this.isExecuting = false; }
    });
  }

  private cmdSetRole(args: string[]): void {
    if (args.length < 2) { this.pushLine('Uso: set-role [userId] [superadmin|admin|cliente]', 'error'); return; }
    const [userId, role] = args;
    if (!['superadmin', 'admin', 'cliente'].includes(role)) { this.pushLine('Rol inválido. Opciones: superadmin, admin, cliente', 'error'); return; }
    this.isExecuting = true;
    this.api.put<any>(`admin/users/${userId}/role`, { role }).subscribe({
      next: () => { this.pushLine(`Rol actualizado a "${role.toUpperCase()}" para el usuario ${userId}`, 'success'); this.isExecuting = false; },
      error: (err) => { this.pushLine(err?.error?.message || 'Error al cambiar rol', 'error'); this.isExecuting = false; }
    });
  }

  private cmdBan(args: string[]): void {
    if (!args.length) { this.pushLine('Uso: ban [email]', 'error'); return; }
    const email = args[0];
    this.isExecuting = true;
    this.api.get<any>('admin/users').subscribe({
      next: (res) => {
        const user = (res.data || []).find((u: any) => u.email === email);
        if (!user) { this.pushLine(`Usuario no encontrado: ${email}`, 'error'); this.isExecuting = false; return; }
        this.api.put<any>(`admin/users/${user._id}`, { isActive: false }).subscribe({
          next: () => { this.pushLine(`Usuario "${user.name}" desactivado.`, 'success'); this.isExecuting = false; },
          error: (err) => { this.pushLine(err?.error?.message || 'Error al desactivar', 'error'); this.isExecuting = false; }
        });
      },
      error: () => { this.pushLine('Error al buscar usuario.', 'error'); this.isExecuting = false; }
    });
  }

  private cmdUnban(args: string[]): void {
    if (!args.length) { this.pushLine('Uso: unban [email]', 'error'); return; }
    const email = args[0];
    this.isExecuting = true;
    this.api.get<any>('admin/users').subscribe({
      next: (res) => {
        const user = (res.data || []).find((u: any) => u.email === email);
        if (!user) { this.pushLine(`Usuario no encontrado: ${email}`, 'error'); this.isExecuting = false; return; }
        this.api.put<any>(`admin/users/${user._id}`, { isActive: true }).subscribe({
          next: () => { this.pushLine(`Usuario "${user.name}" activado.`, 'success'); this.isExecuting = false; },
          error: (err) => { this.pushLine(err?.error?.message || 'Error al activar', 'error'); this.isExecuting = false; }
        });
      },
      error: () => { this.pushLine('Error al buscar usuario.', 'error'); this.isExecuting = false; }
    });
  }

  private cmdDeleteUser(args: string[]): void {
    if (!args.length) { this.pushLine('Uso: delete [userId]', 'error'); return; }
    const userId = args[0];
    this.isExecuting = true;
    this.api.delete<any>(`admin/users/${userId}`).subscribe({
      next: () => { this.pushLine(`Usuario ${userId} eliminado.`, 'success'); this.isExecuting = false; },
      error: (err) => { this.pushLine(err?.error?.message || 'Error al eliminar', 'error'); this.isExecuting = false; }
    });
  }

  private cmdStats(): void {
    this.isExecuting = true;
    this.pushLine('Cargando estadísticas...', 'system');
    this.api.get<any>('admin/stats').subscribe({
      next: (res) => {
        const d = res.data || {};
        this.pushLine('┌─ ESTADÍSTICAS ─────────────────┐', 'output');
        this.pushLine(`│  Usuarios:     ${String(d.totalUsers || 0).padStart(5)}`, 'output');
        this.pushLine(`│  Super Admins: ${String(d.superadmins || 0).padStart(5)}`, 'output');
        this.pushLine(`│  Admins:       ${String(d.admins || 0).padStart(5)}`, 'output');
        this.pushLine(`│  Clientes:     ${String(d.clientes || 0).padStart(5)}`, 'output');
        this.pushLine(`│  Productos:    ${String(d.totalProducts || 0).padStart(5)}`, 'output');
        this.pushLine(`│  Pedidos:      ${String(d.totalOrders || 0).padStart(5)}`, 'output');
        this.pushLine('└────────────────────────────────┘', 'output');
        this.isExecuting = false;
      },
      error: () => { this.pushLine('Error al cargar estadísticas.', 'error'); this.isExecuting = false; }
    });
  }

  private cmdProducts(): void {
    this.isExecuting = true;
    this.pushLine('Cargando productos...', 'system');
    this.api.get<any>('products').subscribe({
      next: (res) => {
        const products = res.data || [];
        this.pushLine(`Total: ${products.length} productos\n`, 'output');
        products.forEach((p: any) => {
          const price = p.prices?.length > 0 ? `$${p.prices[0].price} - $${p.prices[p.prices.length - 1].price}` : 'Sin precios';
          const stock = p.stock > 0 ? '✓' : '✗';
          this.pushLine(`  [${stock}] ${p.name} (${p.category}) - ${price}`, 'output');
        });
        this.isExecuting = false;
      },
      error: () => { this.pushLine('Error al cargar productos.', 'error'); this.isExecuting = false; }
    });
  }

  private cmdOrders(args: string[]): void {
    this.isExecuting = true;
    this.pushLine('Cargando pedidos...', 'system');
    this.api.get<any>('admin/orders').subscribe({
      next: (res) => {
        let orders = res.data || [];
        if (args.length > 0) {
          const status = args[0].toLowerCase();
          orders = orders.filter((o: any) => o.status?.toLowerCase() === status);
        }
        if (orders.length === 0) { this.pushLine('No hay pedidos.', 'output'); this.isExecuting = false; return; }
        this.pushLine(`Total: ${orders.length} pedidos\n`, 'output');
        orders.slice(0, 20).forEach((o: any) => {
          const status = (o.status || 'pending').toUpperCase().padEnd(10);
          const date = new Date(o.createdAt).toLocaleDateString('es-ES');
          this.pushLine(`  [${status}] $${o.total || 0} - ${o.user?.name || 'N/A'} - ${date}`, 'output');
        });
        if (orders.length > 20) this.pushLine(`  ... y ${orders.length - 20} más`, 'system');
        this.isExecuting = false;
      },
      error: () => { this.pushLine('Error al cargar pedidos.', 'error'); this.isExecuting = false; }
    });
  }

  private cmdServer(): void {
    this.isExecuting = true;
    this.pushLine('Verificando servidor...', 'system');
    const start = Date.now();
    this.api.get<any>('health').subscribe({
      next: () => {
        const ms = Date.now() - start;
        this.pushLine('┌─ SERVIDOR ─────────────────────┐', 'success');
        this.pushLine(`│  Estado:     ACTIVO ✓`, 'success');
        this.pushLine(`│  Latencia:   ${ms}ms`, 'output');
        this.pushLine(`│  URL:        asmodeus-developer-api.onrender.com`, 'output');
        this.pushLine('└────────────────────────────────┘', 'success');
        this.isExecuting = false;
      },
      error: () => {
        this.pushLine('┌─ SERVIDOR ─────────────────────┐', 'error');
        this.pushLine('│  Estado:   INACTIVO ✗', 'error');
        this.pushLine('└────────────────────────────────┘', 'error');
        this.isExecuting = false;
      }
    });
  }

  private cmdHistory(): void {
    if (this.commandHistory.length === 0) { this.pushLine('No hay comandos en el historial.', 'output'); return; }
    this.pushLine('┌─ HISTORIAL ────────────────────┐', 'output');
    this.commandHistory.forEach((cmd, i) => {
      this.pushLine(`│  ${String(i + 1).padStart(3)}  ${cmd}`, 'output');
    });
    this.pushLine('└────────────────────────────────┘', 'output');
  }

  private cmdUptime(): void {
    this.isExecuting = true;
    this.api.get<any>('health').subscribe({
      next: (res) => {
        const ts = res.timestamp ? new Date(res.timestamp) : new Date();
        this.pushLine(`Servidor activo desde: ${ts.toLocaleString('es-ES')}`, 'output');
        this.isExecuting = false;
      },
      error: () => { this.pushLine('No se pudo verificar el uptime.', 'error'); this.isExecuting = false; }
    });
  }

  private cmdEnv(): void {
    this.pushLine('┌─ ENTORNO ──────────────────────────────────┐', 'output');
    this.pushLine('│  Frontend URL:  asmodeus-developer.vercel.app  │', 'output');
    this.pushLine('│  Backend URL:   asmodeus-developer-api.render  │', 'output');
    this.pushLine('│  Base de datos: MongoDB Atlas (pagina)      │', 'output');
    this.pushLine('│  Auth:          Google OAuth + JWT           │', 'output');
    this.pushLine('│  Panel:         Angular 15                   │', 'output');
    this.pushLine('└─────────────────────────────────────────────┘', 'output');
  }

  private cmdBanner(): void {
    this.pushLine('╔══════════════════════════════════════════╗', 'system');
    this.pushLine('║   Asmodeus Developer - Terminal v1.0.0       ║', 'system');
    this.pushLine('║   Escribe "help" para ver comandos       ║', 'system');
    this.pushLine('╚══════════════════════════════════════════╝', 'system');
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  private updateTime(): void {
    this.currentTimeStr = this.formatTime(new Date());
  }
}
