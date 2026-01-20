import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite/next';
import * as schema from './schema';

// Open SQLite database
const expoDb = openDatabaseSync('loanlog.db', { enableChangeListener: true });

// Create Drizzle instance
export const db = drizzle(expoDb, { schema });

// Export schema for use in queries
export { schema };

// Initialize database (run migrations if needed)
export async function initializeDatabase() {
  try {
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}
