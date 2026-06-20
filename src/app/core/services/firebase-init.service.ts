import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { ConfigService } from './config.service';

@Injectable({ providedIn: 'root' })
export class FirebaseInitService {
  private app!: FirebaseApp;
  auth!: Auth;
  googleProvider!: GoogleAuthProvider;

  constructor(private configService: ConfigService) {}

  async init(): Promise<void> {
    if (this.app) return;
    await this.configService.loadConfig();
    const firebaseConfig = this.configService.getFirebaseConfig();
    if (firebaseConfig && firebaseConfig.apiKey) {
      this.app = initializeApp(firebaseConfig);
      this.auth = getAuth(this.app);
      this.googleProvider = new GoogleAuthProvider();
      this.googleProvider.addScope('email');
      this.googleProvider.addScope('profile');
    }
  }
}
