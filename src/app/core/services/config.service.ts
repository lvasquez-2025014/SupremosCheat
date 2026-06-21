import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private firebaseConfig: FirebaseConfig | null = null;
  private loaded = false;

  constructor(private http: HttpClient) {}

  async loadConfig(): Promise<void> {
    if (this.loaded) return;
    try {
      const res: any = await this.http.get(`${environment.apiUrl}/config`).toPromise();
      if (res?.data?.firebase && this.isValidFirebaseConfig(res.data.firebase)) {
        this.firebaseConfig = res.data.firebase;
      }
    } catch {
      this.firebaseConfig = null;
    }
    this.loaded = true;
  }

  private isValidFirebaseConfig(cfg: any): boolean {
    return !!(cfg?.apiKey && cfg?.authDomain && cfg?.projectId);
  }

  getFirebaseConfig(): FirebaseConfig | null {
    return this.firebaseConfig;
  }
}
