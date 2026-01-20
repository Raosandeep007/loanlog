/**
 * Dashboard Screen
 * Main dashboard showing loan summary and analytics
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LoanCard from '../components/LoanCard';
import { getDashboardSummary, getUpcomingPayments } from '../services/api';
import { formatCurrency } from '../utils/formatters';

const DashboardScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState(null);
  const [upcomingPayments, setUpcomingPayments] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [summaryData, paymentsData] = await Promise.all([
        getDashboardSummary(),
        getUpcomingPayments()
      ]);

      setSummary(summaryData);
      setUpcomingPayments(paymentsData);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleLoanPress = (loan) => {
    navigation.navigate('LoanDetail', { loanId: loan.id });
  };

  if (loading && !summary) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>LoanLog</Text>
        <Text style={styles.headerSubtitle}>Track your loans easily</Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summarySection}>
        {/* Net Position Card */}
        <View style={[styles.summaryCard, styles.netPositionCard]}>
          <Text style={styles.summaryLabel}>Net Position</Text>
          <Text style={[
            styles.summaryValue,
            { color: summary?.netPosition >= 0 ? '#4CAF50' : '#F44336' }
          ]}>
            {formatCurrency(summary?.netPosition || 0)}
          </Text>
        </View>

        {/* Loans Given */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.halfCard]}>
            <Text style={styles.summaryLabel}>Lent</Text>
            <Text style={[styles.summaryValue, styles.smallValue]}>
              {formatCurrency(summary?.loansGiven?.receivables || 0)}
            </Text>
            <Text style={styles.summaryCount}>
              {summary?.loansGiven?.count || 0} loans
            </Text>
          </View>

          <View style={[styles.summaryCard, styles.halfCard]}>
            <Text style={styles.summaryLabel}>Borrowed</Text>
            <Text style={[styles.summaryValue, styles.smallValue]}>
              {formatCurrency(summary?.loansTaken?.payables || 0)}
            </Text>
            <Text style={styles.summaryCount}>
              {summary?.loansTaken?.count || 0} loans
            </Text>
          </View>
        </View>

        {/* Overdue Card */}
        {summary?.overdue?.count > 0 && (
          <View style={[styles.summaryCard, styles.overdueCard]}>
            <View style={styles.overdueHeader}>
              <Text style={styles.overdueIcon}>⚠️</Text>
              <View>
                <Text style={styles.overdueTitle}>Overdue Payments</Text>
                <Text style={styles.overdueSubtitle}>
                  {summary.overdue.count} loan(s) overdue
                </Text>
              </View>
            </View>
            <Text style={styles.overdueAmount}>
              {formatCurrency(summary.overdue.amount)}
            </Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={() => navigation.navigate('CreateLoan')}
        >
          <Text style={styles.actionButtonText}>+ Add Loan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => navigation.navigate('LoanList')}
        >
          <Text style={styles.secondaryButtonText}>View All Loans</Text>
        </TouchableOpacity>
      </View>

      {/* Upcoming Payments */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Payments</Text>
          {upcomingPayments.length > 3 && (
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          )}
        </View>

        {upcomingPayments.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No upcoming payments</Text>
          </View>
        ) : (
          upcomingPayments.slice(0, 3).map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              onPress={handleLoanPress}
            />
          ))
        )}
      </View>

      {/* Quick Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {summary?.loansGiven?.count + summary?.loansTaken?.count || 0}
            </Text>
            <Text style={styles.statLabel}>Total Loans</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {formatCurrency(
                (summary?.loansGiven?.totalAmount || 0) +
                (summary?.loansTaken?.totalAmount || 0)
              )}
            </Text>
            <Text style={styles.statLabel}>Total Volume</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {summary?.fullyPaidCount || 0}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {summary?.activeCount || 0}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 24,
    paddingTop: 48
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E3F2FD'
  },
  summarySection: {
    padding: 16,
    marginTop: -24
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  netPositionCard: {
    alignItems: 'center',
    paddingVertical: 28
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  halfCard: {
    width: '48%'
  },
  summaryLabel: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 8
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#212121'
  },
  smallValue: {
    fontSize: 24
  },
  summaryCount: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 4
  },
  overdueCard: {
    backgroundColor: '#FFEBEE',
    borderLeftWidth: 4,
    borderLeftColor: '#F44336'
  },
  overdueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  overdueIcon: {
    fontSize: 24,
    marginRight: 12
  },
  overdueTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#C62828'
  },
  overdueSubtitle: {
    fontSize: 12,
    color: '#D32F2F',
    marginTop: 2
  },
  overdueAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#C62828',
    textAlign: 'right'
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4
  },
  primaryButton: {
    backgroundColor: '#2196F3'
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2196F3'
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  },
  secondaryButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600'
  },
  section: {
    padding: 16
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121'
  },
  seeAllText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600'
  },
  emptyState: {
    padding: 32,
    alignItems: 'center'
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9E9E9E'
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center'
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    color: '#757575'
  }
});

export default DashboardScreen;
