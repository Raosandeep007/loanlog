import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { LoanService } from '../src/services/loanService';
import { formatCurrency } from '../src/utils/formatters';

export default function DashboardScreen() {
  const router = useRouter();
  const [summary, setSummary] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // TODO: Replace with actual user ID from auth
  const userId = 'demo-user-id';

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const data = await LoanService.getDashboardSummary(userId);
      setSummary(data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  }, [loadDashboard]);

  if (loading && !summary) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <Text className="text-foreground">Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {/* Header */}
      <View className="bg-primary px-6 pt-12 pb-8">
        <Text className="text-3xl font-bold text-primary-foreground mb-2">LoanLog</Text>
        <Text className="text-sm text-primary-foreground/80">Track your loans easily</Text>
      </View>

      {/* Summary Cards */}
      <View className="px-4 -mt-6">
        {/* Net Position Card */}
        <View className="bg-card rounded-xl p-6 mb-4 shadow-md">
          <Text className="text-sm text-muted-foreground mb-2">Net Position</Text>
          <Text className={`text-4xl font-bold ${summary?.netPosition >= 0 ? 'text-chart-1' : 'text-destructive'}`}>
            {formatCurrency(summary?.netPosition || 0)}
          </Text>
        </View>

        {/* Loans Given & Taken */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-card rounded-xl p-5 shadow-sm">
            <Text className="text-xs text-muted-foreground mb-1">Lent</Text>
            <Text className="text-2xl font-bold text-chart-1">{formatCurrency(summary?.loansGiven?.receivables || 0)}</Text>
            <Text className="text-xs text-muted-foreground mt-1">{summary?.loansGiven?.count || 0} loans</Text>
          </View>

          <View className="flex-1 bg-card rounded-xl p-5 shadow-sm">
            <Text className="text-xs text-muted-foreground mb-1">Borrowed</Text>
            <Text className="text-2xl font-bold text-chart-2">{formatCurrency(summary?.loansTaken?.payables || 0)}</Text>
            <Text className="text-xs text-muted-foreground mt-1">{summary?.loansTaken?.count || 0} loans</Text>
          </View>
        </View>

        {/* Overdue Alert */}
        {summary?.overdue?.count > 0 && (
          <View className="bg-destructive/10 border-l-4 border-destructive rounded-lg p-4 mb-4">
            <View className="flex-row items-center mb-2">
              <Text className="text-2xl mr-3">⚠️</Text>
              <View>
                <Text className="text-base font-semibold text-destructive">Overdue Payments</Text>
                <Text className="text-sm text-destructive/80">{summary.overdue.count} loan(s) overdue</Text>
              </View>
            </View>
            <Text className="text-xl font-bold text-destructive text-right">{formatCurrency(summary.overdue.amount)}</Text>
          </View>
        )}

        {/* Quick Actions */}
        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity className="flex-1 bg-primary rounded-lg py-4 items-center" onPress={() => router.push('/loans/create')}>
            <Text className="text-primary-foreground font-semibold">+ Add Loan</Text>
          </TouchableOpacity>

          <TouchableOpacity className="flex-1 bg-card border border-primary rounded-lg py-4 items-center" onPress={() => router.push('/loans')}>
            <Text className="text-primary font-semibold">View All Loans</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View>
          <Text className="text-xl font-bold text-foreground mb-4">Quick Stats</Text>
          <View className="flex-row flex-wrap justify-between">
            <View className="w-[48%] bg-card rounded-lg p-4 mb-3 items-center">
              <Text className="text-3xl font-bold text-chart-1">{summary?.totalLoans || 0}</Text>
              <Text className="text-xs text-muted-foreground mt-1">Total Loans</Text>
            </View>

            <View className="w-[48%] bg-card rounded-lg p-4 mb-3 items-center">
              <Text className="text-3xl font-bold text-chart-3">{summary?.fullyPaidCount || 0}</Text>
              <Text className="text-xs text-muted-foreground mt-1">Completed</Text>
            </View>

            <View className="w-[48%] bg-card rounded-lg p-4 mb-3 items-center">
              <Text className="text-3xl font-bold text-chart-2">{summary?.activeCount || 0}</Text>
              <Text className="text-xs text-muted-foreground mt-1">Active</Text>
            </View>

            <View className="w-[48%] bg-card rounded-lg p-4 mb-3 items-center">
              <Text className="text-3xl font-bold text-chart-4">
                {formatCurrency((summary?.loansGiven?.totalAmount || 0) + (summary?.loansTaken?.totalAmount || 0))}
              </Text>
              <Text className="text-xs text-muted-foreground mt-1">Total Volume</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
