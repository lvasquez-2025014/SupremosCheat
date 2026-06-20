export const config = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGO_URI || 'mongodb+srv://ludwingivanvasqueznavas_db_user:hVyc9ZTzbazjMq9i@cluster0.bswryim.mongodb.net/pagina?appName=Cluster0',
  jwtSecret: process.env.JWT_SECRET || 'pagina_secret_key_change_in_production',
  jwtExpiresIn: 180,
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  firebase: {
    apiKey: process.env.FIREBASE_API_KEY || '',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.FIREBASE_APP_ID || '',
  },
};
