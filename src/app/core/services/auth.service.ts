import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, map } from 'rxjs';
import { signInWithPopup, GoogleAuthProvider, UserCredential } from 'firebase/auth';
import { FirebaseInitService } from './firebase-init.service';
import { environment } from '@env/environment';
import { LoginRequest, LoginResponse, ApiResponse } from '@models/index';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(
    private http: HttpClient,
    private router: Router,
    private firebaseInit: FirebaseInitService
  ) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/login`, credentials).pipe(
      map((res) => res.data),
      tap((data) => {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      })
    );
  }

  register(data: { name: string; email: string; password: string }): Observable<LoginResponse> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/register`, data).pipe(
      map((res) => res.data),
      tap((data) => {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      })
    );
  }

  googleLogin(): Promise<LoginResponse> {
    return this.firebaseInit.init().then(() => {
      return signInWithPopup(this.firebaseInit.auth, this.firebaseInit.googleProvider)
        .then((result: UserCredential) => result.user.getIdToken())
        .then((idToken) => {
          return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/google`, { idToken })
            .pipe(
              map((res) => res.data),
              tap((data) => {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
              })
            ).toPromise();
        });
    }) as Promise<LoginResponse>;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/auth/login']);
  }

  get isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  get user(): LoginResponse['user'] | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
}
