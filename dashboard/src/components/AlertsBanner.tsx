import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, XCircle, Info } from 'lucide-react';
import { Alert as AlertType } from '../types/device';

interface AlertsBannerProps {
  alerts: AlertType[];
}

export const AlertsBanner = ({ alerts }: AlertsBannerProps) => {
  if (alerts.length === 0) return null;

  const getAlertIcon = (level: AlertType['level']) => {
    switch (level) {
      case 'critical':
        return <XCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getAlertVariant = (level: AlertType['level']) => {
    switch (level) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-2 mb-6">
      {alerts.map((alert) => (
        <Alert 
          key={alert.id} 
          variant={getAlertVariant(alert.level)}
          className={`rounded-2xl ${
            alert.level === 'warning' ? 'border-warning bg-warning/10' : ''
          }`}
        >
          {getAlertIcon(alert.level)}
          <AlertDescription>
            <span className="font-medium">{alert.message}</span>
            <span className="text-xs text-muted-foreground ml-2">
              {new Date(alert.timestamp).toLocaleTimeString()}
            </span>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
};