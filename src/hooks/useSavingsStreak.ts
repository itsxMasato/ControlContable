import { useMemo } from 'react';
import { useAppData } from '../context/AppDataContext';
import { totalMonthlyBudget, weeklySpendTotals } from '../utils/calculations';

export function useSavingsStreak(): number {
  const { data } = useAppData();
  return useMemo(() => {
    const budget = totalMonthlyBudget(data.categories);
    if (budget <= 0) return 0;
    const weeklyBudget = budget / 4.33;
    const weeks = weeklySpendTotals(data.transactions, 20);
    const completedWeeks = weeks.slice(0, -1); // ignora la semana en curso, aún incompleta
    let streak = 0;
    for (let i = completedWeeks.length - 1; i >= 0; i--) {
      if (completedWeeks[i].total > 0 && completedWeeks[i].total <= weeklyBudget) streak++;
      else break;
    }
    return streak;
  }, [data]);
}
