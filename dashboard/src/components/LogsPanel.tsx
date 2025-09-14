import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Terminal } from 'lucide-react';

interface LogsPanelProps {
  logs: string[];
}

export const LogsPanel = ({ logs }: LogsPanelProps) => {
  return (
    <Card className="rounded-2xl shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Terminal className="h-5 w-5" />
          Real-time Logs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64 w-full">
          <div className="space-y-1">
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-sm">No logs available</p>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className="text-xs font-mono text-foreground border-l-2 border-primary pl-2 py-1"
                >
                  {log}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};