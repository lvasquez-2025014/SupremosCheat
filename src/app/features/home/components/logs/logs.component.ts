import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';

interface LogEntry {
  _id: string;
  event: string;
  userName: string;
  email: string;
  ip: string;
  userAgent: string;
  success: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss']
})
export class LogsComponent implements OnInit, OnDestroy {
  logs: LogEntry[] = [];
  loading = true;
  private pollInterval: any;
  private lastTimestamp: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadLogs();
    this.pollInterval = setInterval(() => this.loadLogs(), 5000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  loadLogs(): void {
    const url = this.lastTimestamp
      ? `${environment.apiUrl}/admin/logs?since=${this.lastTimestamp}`
      : `${environment.apiUrl}/admin/logs?limit=50`;

    this.http.get<any>(url).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          if (this.lastTimestamp) {
            const newLogs = res.data.filter((l: LogEntry) =>
              !this.logs.some(existing => existing._id === l._id)
            );
            this.logs = [...newLogs, ...this.logs].slice(0, 100);
          } else {
            this.logs = res.data;
          }
          if (this.logs.length > 0) {
            this.lastTimestamp = this.logs[0].createdAt;
          }
        }
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  getEventIcon(event: string): string {
    switch (event) {
      case 'LOGIN': return 'fas fa-sign-in-alt';
      case 'REGISTER': return 'fas fa-user-plus';
      case 'LOGIN_FAILED': return 'fas fa-exclamation-triangle';
      case 'GOOGLE_LOGIN': return 'fab fa-google';
      default: return 'fas fa-circle';
    }
  }

  getEventColor(event: string): string {
    switch (event) {
      case 'LOGIN': return 'text-green-400';
      case 'REGISTER': return 'text-cyan-400';
      case 'LOGIN_FAILED': return 'text-red-400';
      case 'GOOGLE_LOGIN': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  }

  getEventLabel(event: string): string {
    switch (event) {
      case 'LOGIN': return 'LOGIN_OK';
      case 'REGISTER': return 'REGISTER';
      case 'LOGIN_FAILED': return 'AUTH_FAIL';
      case 'GOOGLE_LOGIN': return 'GOOGLE_AUTH';
      default: return event;
    }
  }

  getTimestamp(date: string): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${h}:${m}:${s}`;
  }

  getShortUA(ua: string): string {
    if (!ua) return 'unknown';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Other';
  }

  trackById(index: number, item: LogEntry): string {
    return item._id;
  }
}
