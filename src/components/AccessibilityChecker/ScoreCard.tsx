// src/components/AccessibilityChecker/ScoreCard.tsx
// Score Card - Displays accessibility score and grade

import { useTranslations } from '@/hooks/useTranslations';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface ScoreCardProps {
  score: number;
  grade: string;
  krdsCompliant: boolean;
}

export function ScoreCard({ score, grade, krdsCompliant }: ScoreCardProps) {
  const { t: translate } = useTranslations();

  const getGradeColor = (grade: string): string => {
    const colors = {
      A: 'bg-green-500',
      B: 'bg-blue-500',
      C: 'bg-yellow-500',
      D: 'bg-orange-500',
      F: 'bg-red-500',
    };
    return colors[grade as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          {/* Circular Score Display */}
          <div className={`relative w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-xl ${getGradeColor(grade)}`}>
            {score}
          </div>

          {/* Grade Badge */}
          <div>
            <div className="text-2xl font-bold">{grade}</div>
            <div className="text-sm text-muted-foreground">{translate(`accessibility.grades.${grade}`)}</div>
          </div>

          {/* KRDS Badge */}
          {krdsCompliant && (
            <Badge variant="secondary" className="ml-2">
              {translate('accessibility.krdsCompliant')}
            </Badge>
          )}
        </div>

        {/* Score Progress Bar */}
        <div className="mt-4">
          <Progress value={score} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
