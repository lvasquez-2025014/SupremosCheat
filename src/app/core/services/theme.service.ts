import { Injectable } from '@angular/core';

export interface ThemeColor {
  name: string;
  label: string;
  primary: string;
  primaryRgb: string;
  accent: string;
  glow: string;
  gradient: string;
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'asmodeus_theme';

  themes: ThemeColor[] = [
    { name: 'cyan', label: 'Cyan', primary: '#22d3ee', primaryRgb: '34,211,238', accent: '#06b6d4', glow: 'rgba(34,211,238,0.3)', gradient: 'linear-gradient(135deg, #22d3ee, #06b6d4)' },
    { name: 'green', label: 'Verde', primary: '#22c55e', primaryRgb: '34,197,94', accent: '#16a34a', glow: 'rgba(34,197,94,0.3)', gradient: 'linear-gradient(135deg, #22c55e, #16a34a)' },
    { name: 'pink', label: 'Rosa', primary: '#f472b6', primaryRgb: '244,114,182', accent: '#ec4899', glow: 'rgba(244,114,182,0.3)', gradient: 'linear-gradient(135deg, #f472b6, #ec4899)' },
    { name: 'orange', label: 'Naranja', primary: '#f97316', primaryRgb: '249,115,22', accent: '#ea580c', glow: 'rgba(249,115,22,0.3)', gradient: 'linear-gradient(135deg, #f97316, #ea580c)' },
    { name: 'violet', label: 'Violeta', primary: '#a78bfa', primaryRgb: '167,139,250', accent: '#8b5cf6', glow: 'rgba(167,139,250,0.3)', gradient: 'linear-gradient(135deg, #a78bfa, #8b5cf6)' },
    { name: 'red', label: 'Rojo', primary: '#ef4444', primaryRgb: '239,68,68', accent: '#dc2626', glow: 'rgba(239,68,68,0.3)', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)' },
    { name: 'yellow', label: 'Amarillo', primary: '#eab308', primaryRgb: '234,179,8', accent: '#ca8a04', glow: 'rgba(234,179,8,0.3)', gradient: 'linear-gradient(135deg, #eab308, #ca8a04)' },
    { name: 'white', label: 'Blanco', primary: '#e2e8f0', primaryRgb: '226,232,240', accent: '#cbd5e1', glow: 'rgba(226,232,240,0.2)', gradient: 'linear-gradient(135deg, #e2e8f0, #cbd5e1)' },
  ];

  currentTheme: ThemeColor;

  constructor() {
    const saved = this.getSavedTheme();
    this.currentTheme = saved || this.themes[0];
    this.applyTheme(this.currentTheme);
  }

  setTheme(theme: ThemeColor): void {
    this.currentTheme = theme;
    this.applyTheme(theme);
    localStorage.setItem(this.STORAGE_KEY, theme.name);
  }

  private applyTheme(theme: ThemeColor): void {
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', theme.primary);
    root.style.setProperty('--theme-primary-rgb', theme.primaryRgb);
    root.style.setProperty('--theme-accent', theme.accent);
    root.style.setProperty('--theme-glow', theme.glow);
    root.style.setProperty('--theme-gradient', theme.gradient);
  }

  private getSavedTheme(): ThemeColor | null {
    const name = localStorage.getItem(this.STORAGE_KEY);
    if (!name) return null;
    return this.themes.find(t => t.name === name) || null;
  }
}
