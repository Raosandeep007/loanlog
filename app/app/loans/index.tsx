import { View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { LoanService } from '../../src/services/loanService';
import LoanCard from '../../components/LoanCard';
import type { Loan } from '../../src/db/schema';

export default function LoansListScreen() {
  const router = useRouter();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'given' | 'taken'>('all');

  // TODO: Replace with actual user ID from auth
  const userId = 'demo-user-id';

  const loadLoans = useCallback(async () => {
    try {
      setLoading(true);
      const { loans: data } = await LoanService.getLoans({
        userId,
        loanType: filter === 'all' ? undefined : filter,
        limit: 100,
      });
      setLoans(data);
    } catch (error) {
      console.error('Failed to load loans:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, filter]);

  useEffect(() => {
    loadLoans();
  }, [loadLoans]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLoans();
    setRefreshing(false);
  }, [loadLoans]);

  if (loading && loans.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <Text className="text-foreground">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Filter Tabs */}
      <View className="flex-row px-4 pt-4 gap-2">
        <TouchableOpacity
          className={`flex-1 py-3 rounded-lg ${filter === 'all' ? 'bg-primary' : 'bg-card'}`}
          onPress={() => setFilter('all')}
        >
          <Text className={`text-center font-semibold ${filter === 'all' ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-3 rounded-lg ${filter === 'given' ? 'bg-primary' : 'bg-card'}`}
          onPress={() => setFilter('given')}
        >
          <Text className={`text-center font-semibold ${filter === 'given' ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
            📤 Lent
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-3 rounded-lg ${filter === 'taken' ? 'bg-primary' : 'bg-card'}`}
          onPress={() => setFilter('taken')}
        >
          <Text className={`text-center font-semibold ${filter === 'taken' ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
            📥 Borrowed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loans List */}
      <FlatList
        data={loans}
        renderItem={({ item }) => <LoanCard loan={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-lg text-muted-foreground mb-4">No loans found</Text>
            <TouchableOpacity className="bg-primary px-6 py-3 rounded-lg" onPress={() => router.push('/loans/create')}>
              <Text className="text-primary-foreground font-semibold">+ Create Your First Loan</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-primary w-14 h-14 rounded-full items-center justify-center shadow-xl"
        onPress={() => router.push('/loans/create')}
      >
        <Text className="text-primary-foreground text-3xl font-light">+</Text>
      </TouchableOpacity>
    </View>
  );
}
