import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Brain } from 'lucide-react';

interface AIInsightsProps {
  insight: string;
}

export const AIInsights = ({ insight }: AIInsightsProps) => {
  // Split insight into individual sentences for better display
  const insightParts = insight.split('. ').filter(Boolean);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          AI Investment Insights
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insightParts.map((part, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/50"
            >
              <span className="text-lg">{part.trim().charAt(0)}</span>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {part.trim().slice(1).trim()}
                {index < insightParts.length - 1 && !part.endsWith('.') ? '.' : ''}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/30">
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-3 w-3" />
            These insights are generated using AI-based analysis of your investment data
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
