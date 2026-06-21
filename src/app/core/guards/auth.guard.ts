import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean | UrlTree {
    const token = localStorage.getItem('token');
    if (!token) return this.router.parseUrl('/auth/login');

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiresAt = payload.exp * 1000;
      if (Date.now() >= expiresAt) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return this.router.parseUrl('/auth/login');
      }
      return true;
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return this.router.parseUrl('/auth/login');
    }
  }
}
