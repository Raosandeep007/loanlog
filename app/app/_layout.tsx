import { Stack } from 'expo-router';
import { useEffect } from 'react';
import '../global.css';
import { initializeDatabase } from '../src/db/client';

export default function RootLayout() {
  useEffect(() => {
    // Initialize database on app start
    initializeDatabase().catch(console.error);
  }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0152cb',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'LoanLog' }} />
      <Stack.Screen name="loans/index" options={{ title: 'All Loans' }} />
      <Stack.Screen name="loans/create" options={{ title: 'Create Loan' }} />
      <Stack.Screen name="loans/[id]" options={{ title: 'Loan Details' }} />
    </Stack>
  );
}
