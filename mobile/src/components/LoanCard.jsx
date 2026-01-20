/**
 * LoanCard Component
 * Displays loan summary in a card format
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { formatCurrency, formatDate } from '../utils/formatters';

const LoanCard = ({ loan, onPress }) => {
  const getStatusColor = (status) => {
    const colors = {
      active: '#4CAF50',
      partially_paid: '#FF9800',
      fully_paid: '#2196F3',
      overdue: '#F44336',
      written_off: '#9E9E9E'
    };
    return colors[status] || '#757575';
  };

  const getStatusText = (status) => {
    return status.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(loan)}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.counterpartyName}>{loan.counterpartyName}</Text>
          <Text style={styles.loanType}>
            {loan.loanType === 'given' ? '📤 Lent' : '📥 Borrowed'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(loan.status) }]}>
          <Text style={styles.statusText}>{getStatusText(loan.status)}</Text>
        </View>
      </View>

      {/* Amount Details */}
      <View style={styles.amountSection}>
        <View style={styles.amountRow}>
          <Text style={styles.label}>Principal:</Text>
          <Text style={styles.amount}>
            {formatCurrency(loan.principalAmount, loan.currency)}
          </Text>
        </View>

        {loan.interestRate > 0 && (
          <View style={styles.amountRow}>
            <Text style={styles.label}>Interest Rate:</Text>
            <Text style={styles.amount}>{loan.interestRate}% p.a.</Text>
          </View>
        )}

        <View style={styles.amountRow}>
          <Text style={styles.label}>Total Due:</Text>
          <Text style={[styles.amount, styles.totalAmount]}>
            {formatCurrency(loan.totalAmountDue, loan.currency)}
          </Text>
        </View>

        <View style={styles.amountRow}>
          <Text style={styles.label}>Outstanding:</Text>
          <Text style={[styles.amount, styles.outstandingAmount]}>
            {formatCurrency(loan.outstandingBalance, loan.currency)}
          </Text>
        </View>
      </View>

      {/* Dates */}
      <View style={styles.dateSection}>
        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>Issue Date</Text>
          <Text style={styles.dateValue}>{formatDate(loan.issueDate)}</Text>
        </View>
        {loan.dueDate && (
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Due Date</Text>
            <Text style={styles.dateValue}>{formatDate(loan.dueDate)}</Text>
          </View>
        )}
      </View>

      {/* Progress Bar */}
      {loan.totalAmountDue > 0 && (
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(loan.totalPaid / loan.totalAmountDue) * 100}%`,
                  backgroundColor: getStatusColor(loan.status)
                }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {((loan.totalPaid / loan.totalAmountDue) * 100).toFixed(1)}% Paid
          </Text>
        </View>
      )}

      {/* Tags */}
      {loan.tags && loan.tags.length > 0 && (
        <View style={styles.tagsSection}>
          {loan.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  headerLeft: {
    flex: 1
  },
  counterpartyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4
  },
  loanType: {
    fontSize: 14,
    color: '#757575'
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600'
  },
  amountSection: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  label: {
    fontSize: 14,
    color: '#757575'
  },
  amount: {
    fontSize: 14,
    color: '#212121',
    fontWeight: '500'
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3'
  },
  outstandingAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F44336'
  },
  dateSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  dateItem: {
    flex: 1
  },
  dateLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4
  },
  dateValue: {
    fontSize: 14,
    color: '#212121',
    fontWeight: '500'
  },
  progressSection: {
    marginBottom: 12
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4
  },
  progressFill: {
    height: '100%',
    borderRadius: 4
  },
  progressText: {
    fontSize: 12,
    color: '#757575',
    textAlign: 'right'
  },
  tagsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8
  },
  tag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6
  },
  tagText: {
    fontSize: 12,
    color: '#1976D2'
  }
});

export default LoanCard;
