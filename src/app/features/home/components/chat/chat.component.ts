import { Component, OnInit, OnDestroy } from '@angular/core';
import { ChatService } from '@core/services/chat.service';
import { AuthService } from '@core/services/auth.service';
import { ApiService } from '@core/services/api.service';
import { Conversation, Message, Notification, User } from '@models/index';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy {
  user = this.auth.user;

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
  chatSearchInput = '';
  membersVisible = true;
  replyTo: any = null;
  showEmojiPicker = false;
  onlineUserIds: string[] = [];
  chatChannelsOpen = false;
  chatFocusMode = false;
  chatSmartPanelOpen = true;
  chatPanelTab: 'members' | 'threads' = 'members';
  toasts: { id: number; title: string; message: string; type: string }[] = [];
  private toastCounter = 0;

  apiNotifications: Notification[] = [];
  showNotifications = false;

  emojis = ['😀','😂','🔥','💯','❤️','👀','🎮','💎','👑','⚡','🚀','✅','❌','🎯','💪','🙏','😎','🤝','💥','⭐','🏆','🎁','💰','🔑','🛡️','⚔️','🎲','🌟','✨','💫'];

  get threadMessages() { return this.chatMessages.filter((m: any) => m.replyTo); }

  private heartbeatInterval: any;
  private refreshInterval: any;
  private msgPollInterval: any;

  constructor(
    private auth: AuthService,
    private api: ApiService,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    this.loadChat();
    this.loadNotifications();

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

    this.refreshInterval = setInterval(() => {
      this.loadChat();
    }, 5000);

    this.msgPollInterval = setInterval(() => {
      if (this.activeChat) {
        this.refreshMessages();
      }
    }, 2000);
  }

  ngOnDestroy(): void {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    if (this.msgPollInterval) clearInterval(this.msgPollInterval);
  }

  loadChat(): void {
    this.chatService.getConversations().subscribe({
      next: (res) => {
        if (res.data) {
          this.chatAllConversations = res.data;
          this.chatChannels = res.data.filter((c: any) => c.type === 'channel');
          this.chatConversations = res.data.filter((c: any) => c.type !== 'channel');
        }
      },
      error: () => {}
    });
  }

  refreshMessages(): void {
    if (!this.activeChat) return;
    const chatId = this.activeChat._id;
    const el = document.getElementById('chatMessagesContainer');
    const wasAtBottom = el ? (el.scrollHeight - el.scrollTop - el.clientHeight) < 60 : false;

    this.chatService.getMessages(chatId).subscribe({
      next: (res) => {
        if (!res.data) return;
        const newMsgs = res.data;
        if (newMsgs.length === 0) return;

        const existingIds = new Set(this.chatMessages.map((m: any) => m._id));
        const fresh = newMsgs.filter((m: any) => !existingIds.has(m._id));

        if (fresh.length > 0) {
          fresh.forEach((m: any) => m._new = true);
          this.chatMessages = [...this.chatMessages, ...fresh];
          if (wasAtBottom) {
            this.scrollToBottom();
          }
          setTimeout(() => {
            fresh.forEach((m: any) => m._new = false);
          }, 300);
        } else {
          this.chatMessages = newMsgs;
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

  toggleChatFocusMode(): void {
    this.chatFocusMode = !this.chatFocusMode;
    this.showToast(this.chatFocusMode ? 'Modo Enfoque' : 'Modo Normal', this.chatFocusMode ? 'Paneles laterales ocultos' : 'Paneles restaurados', 'info');
  }

  toggleChatSmartPanel(): void {
    this.chatSmartPanelOpen = !this.chatSmartPanelOpen;
  }

  switchChatPanelTab(tab: 'members' | 'threads'): void {
    this.chatPanelTab = tab;
  }

  showToast(title: string, message: string, type: string = 'info'): void {
    const id = ++this.toastCounter;
    this.toasts.push({ id, title, message, type });
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== id);
    }, 3000);
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

  trackByMsgId(_index: number, msg: any): string {
    return msg._id;
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

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  getTimeAgo(timestamp: any): string {
    if (!timestamp) return '';
    const now = new Date();
    const then = new Date(timestamp);
    const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
    if (diff < 60) return 'Ahora';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `Hace ${Math.floor(diff / 86400)}d`;
    return then.toLocaleDateString('es-ES');
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

  getGradient(role: string, senderName?: string): string {
    const name = senderName || role;
    return this.getUserColor(name);
  }

  getRoleBadgeClass(role: string): string {
    if (role === 'superadmin') return 'badge-superadmin';
    if (role === 'admin') return 'badge-admin';
    return 'badge-client';
  }

  getRoleLabel(role: string): string {
    if (role === 'superadmin') return 'SUPER ADMIN';
    if (role === 'admin') return 'ADMIN';
    return 'CLIENTE';
  }

  getTextColor(role: string, senderName?: string): string {
    return 'text-custom-name';
  }
}
