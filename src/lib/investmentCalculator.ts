import { Investment, InvestmentResult } from '@/types/investment';

export function calculateInvestment(investment: Investment): InvestmentResult {
  // Step 1: Investment Calculation
  const totalInvestment = investment.buyPrice * investment.quantity;
  const currentValue = investment.sellPrice * investment.quantity;
  const profit = currentValue - totalInvestment;
  const returnPercentage = totalInvestment > 0 ? (profit / totalInvestment) * 100 : 0;

  // Step 2: Tax Logic (Rule-Based AI)
  const buyDate = new Date(investment.buyDate);
  const sellDate = investment.sellDate ? new Date(investment.sellDate) : new Date();
  const holdingDays = Math.floor((sellDate.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24));
  const holdingMonths = holdingDays / 30;
  const isLongTerm = holdingMonths >= 12;

  const taxType = isLongTerm ? 'Long-Term Capital Gain' : 'Short-Term Capital Gain';
  const taxAmount = profit > 0 ? (profit * investment.taxSlab) / 100 : 0;
  const netProfit = profit - taxAmount;

  // Step 3: AI Insight Generation
  const aiInsight = generateAIInsight({
    profit,
    returnPercentage,
    taxType,
    taxAmount,
    netProfit,
    holdingMonths,
    stockName: investment.stockName,
  });

  return {
    totalInvestment,
    currentValue,
    profit,
    returnPercentage,
    taxType,
    taxAmount,
    netProfit,
    aiInsight,
  };
}

interface InsightParams {
  profit: number;
  returnPercentage: number;
  taxType: string;
  taxAmount: number;
  netProfit: number;
  holdingMonths: number;
  stockName: string;
}

function generateAIInsight(params: InsightParams): string {
  const { profit, returnPercentage, taxType, taxAmount, netProfit, holdingMonths, stockName } = params;

  const insights: string[] = [];

  // Performance insight
  if (returnPercentage > 20) {
    insights.push(`🚀 Excellent! Your ${stockName} investment generated ${returnPercentage.toFixed(1)}% returns - outstanding performance!`);
  } else if (returnPercentage > 10) {
    insights.push(`📈 Good returns! Your ${stockName} investment grew by ${returnPercentage.toFixed(1)}%, beating typical savings rates.`);
  } else if (returnPercentage > 0) {
    insights.push(`💰 Your ${stockName} investment generated ${returnPercentage.toFixed(1)}% returns - a modest but positive gain.`);
  } else if (returnPercentage === 0) {
    insights.push(`⚖️ Your ${stockName} investment broke even. Consider holding longer for potential growth.`);
  } else {
    insights.push(`📉 Your ${stockName} investment shows a ${Math.abs(returnPercentage).toFixed(1)}% loss. Market volatility is normal - consider your long-term strategy.`);
  }

  // Tax insight
  if (profit > 0) {
    const taxImpactPercent = (taxAmount / profit) * 100;
    if (taxType === 'Short-Term Capital Gain') {
      insights.push(`🧾 ${taxType} tax of ₹${formatIndianNumber(taxAmount)} applies (${taxImpactPercent.toFixed(1)}% of profit). Holding for 12+ months could reduce tax.`);
    } else {
      insights.push(`🧾 ${taxType} tax benefit applies! You saved on taxes by holding long-term.`);
    }
  }

  // Holding period insight
  if (holdingMonths < 12 && profit > 0) {
    const monthsToLTCG = Math.ceil(12 - holdingMonths);
    insights.push(`⏳ Tip: Holding ${monthsToLTCG} more month(s) would qualify for lower long-term tax rates.`);
  }

  // Net profit insight
  if (netProfit > 0) {
    insights.push(`✅ After tax, your net profit is ₹${formatIndianNumber(netProfit)}. Great job!`);
  } else if (profit > 0 && netProfit < profit) {
    insights.push(`💡 Tax reduced your profit by ₹${formatIndianNumber(taxAmount)}. Consider tax-saving investment options.`);
  }

  return insights.join(' ');
}

export function formatIndianNumber(num: number): string {
  const absNum = Math.abs(num);
  if (absNum >= 10000000) {
    return (num / 10000000).toFixed(2) + ' Cr';
  } else if (absNum >= 100000) {
    return (num / 100000).toFixed(2) + ' L';
  }
  return num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}
