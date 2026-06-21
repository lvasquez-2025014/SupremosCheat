import mongoose from 'mongoose';
import { config } from '../config';

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('[DB] Conectado a MongoDB');
  } catch (error) {
    console.error('[DB] Error de conexión');
    process.exit(1);
  }

  mongoose.connection.on('error', () => {
    console.error('[DB] Error de conexión');
  });

  mongoose.connection.on('disconnected', () => {
    console.log('[DB] Desconectado');
  });
}
