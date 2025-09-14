import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { AlertLevel } from '../types/device';

interface MetricCardProps {
  title: string;
  value: number | string | boolean;
  unit?: string;
  alertLevel?: AlertLevel;
  icon?: React.ReactNode;
  format?: 'number' | 'percentage' | 'boolean';
}

export const MetricCard = ({ 
  title, 
  value, 
  unit, 
  alertLevel = 'normal', 
  icon,
  format = 'number' 
}: MetricCardProps) => {
  const getAlertIcon = () => {
    switch (alertLevel) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return <CheckCircle className="h-4 w-4 text-success" />;
    }
  };

  const getAlertStyles = () => {
    switch (alertLevel) {
      case 'critical':
        return 'border-destructive bg-destructive/5';
      case 'warning':
        return 'border-warning bg-warning/5';
      default:
        return 'border-border bg-card';
    }
  };

  const formatValue = () => {
    if (format === 'boolean') {
      return value ? 'Active' : 'Inactive';
    }
    if (format === 'percentage') {
      return `${typeof value === 'number' ? value.toFixed(1) : value}%`;
    }
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    return value;
  };

  return (
    <Card className={`rounded-2xl shadow-md p-4 ${getAlertStyles()}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          {icon}
          {getAlertIcon()}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="text-2xl font-bold text-foreground">
          {formatValue()}
          {unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
        </div>
      </CardContent>
    </Card>
  );
};