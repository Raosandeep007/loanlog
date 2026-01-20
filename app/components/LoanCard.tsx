import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { formatCurrency, formatDate, getStatusColor, getStatusBgColor, formatLoanType, getLoanTypeIcon } from '../src/utils/formatters';
import type { Loan } from '../src/db/schema';

interface LoanCardProps {
  loan: Loan;
}

export default function LoanCard({ loan }: LoanCardProps) {
  const router = useRouter();

  const statusColor = getStatusColor(loan.status);
  const statusBg = getStatusBgColor(loan.status);

  const progress = loan.totalAmountDue ? ((loan.totalPaid || 0) / loan.totalAmountDue) * 100 : 0;

  return (
    <TouchableOpacity className="bg-card rounded-xl p-4 mb-3 shadow-sm" onPress={() => router.push(`/loans/${loan.id}`)}>
      {/* Header */}
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="text-lg font-bold text-card-foreground mb-1">{loan.counterpartyName}</Text>
          <Text className="text-sm text-muted-foreground">
            {getLoanTypeIcon(loan.loanType)} {formatLoanType(loan.loanType)}
          </Text>
        </View>
        <View className={`px-3 py-1 rounded-full ${statusBg}`}>
          <Text className={`text-xs font-semibold ${statusColor} capitalize`}>{loan.status.replace('_', ' ')}</Text>
        </View>
      </View>

      {/* Amount Details */}
      <View className="border-t border-border pt-3 mb-3">
        <View className="flex-row justify-between mb-2">
          <Text className="text-sm text-muted-foreground">Principal</Text>
          <Text className="text-sm font-medium text-card-foreground">{formatCurrency(loan.principalAmount, loan.currency)}</Text>
        </View>

        {loan.interestRate > 0 && (
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-muted-foreground">Interest Rate</Text>
            <Text className="text-sm font-medium text-card-foreground">{loan.interestRate}% p.a.</Text>
          </View>
        )}

        <View className="flex-row justify-between mb-2">
          <Text className="text-sm text-muted-foreground">Total Due</Text>
          <Text className="text-base font-bold text-primary">{formatCurrency(loan.totalAmountDue, loan.currency)}</Text>
        </View>

        <View className="flex-row justify-between">
          <Text className="text-sm text-muted-foreground">Outstanding</Text>
          <Text className="text-base font-bold text-destructive">{formatCurrency(loan.outstandingBalance, loan.currency)}</Text>
        </View>
      </View>

      {/* Dates */}
      <View className="flex-row justify-between mb-3">
        <View>
          <Text className="text-xs text-muted-foreground mb-1">Issue Date</Text>
          <Text className="text-sm font-medium text-card-foreground">{formatDate(loan.issueDate)}</Text>
        </View>
        {loan.dueDate && (
          <View>
            <Text className="text-xs text-muted-foreground mb-1">Due Date</Text>
            <Text className="text-sm font-medium text-card-foreground">{formatDate(loan.dueDate)}</Text>
          </View>
        )}
      </View>

      {/* Progress Bar */}
      {loan.totalAmountDue > 0 && (
        <View>
          <View className="h-2 bg-muted rounded-full overflow-hidden">
            <View
              className={`h-full rounded-full ${statusBg}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </View>
          <Text className="text-xs text-muted-foreground text-right mt-1">{progress.toFixed(1)}% Paid</Text>
        </View>
      )}

      {/* Tags */}
      {loan.tags && loan.tags.length > 0 && (
        <View className="flex-row flex-wrap mt-3 gap-2">
          {loan.tags.map((tag, index) => (
            <View key={index} className="bg-accent px-3 py-1 rounded-full">
              <Text className="text-xs text-accent-foreground">{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}
