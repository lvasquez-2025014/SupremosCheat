import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private firebaseConfig: any = null;
  private loaded = false;

  constructor(private http: HttpClient) {}

  async loadConfig(): Promise<void> {
    if (this.loaded) return;
    try {
      const res: any = await this.http.get(`${environment.apiUrl}/config`).toPromise();
      if (res?.data?.firebase) {
        this.firebaseConfig = res.data.firebase;
      }
    } catch {
      this.firebaseConfig = {};
    }
    this.loaded = true;
  }

  getFirebaseConfig(): any {
    return this.firebaseConfig || {};
  }
}
