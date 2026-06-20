import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getConversations(): Observable<any> {
    return this.http.get(`${this.apiUrl}/chat/conversations`);
  }

  createConversation(participantId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/chat/conversations`, { participantId });
  }

  getMessages(conversationId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/chat/conversations/${conversationId}/messages`);
  }

  sendMessage(conversationId: string, content: string, type: string = 'text'): Observable<any> {
    return this.http.post(`${this.apiUrl}/chat/conversations/${conversationId}/messages`, { content, type });
  }

  markAsRead(conversationId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/chat/conversations/${conversationId}/read`, {});
  }

  getChatUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/chat/users`);
  }

  getNotifications(): Observable<any> {
    return this.http.get(`${this.apiUrl}/chat/notifications`);
  }

  markNotificationRead(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/chat/notifications/${id}/read`, {});
  }

  markAllNotificationsRead(): Observable<any> {
    return this.http.put(`${this.apiUrl}/chat/notifications/read-all`, {});
  }
}
