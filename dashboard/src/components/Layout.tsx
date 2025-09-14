import { ReactNode, useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';

interface LayoutProps {
  children: ReactNode;
  onDeviceSelect?: (deviceId: string) => void;
  selectedDevice?: string;
  showHeader?: boolean;
  headerTitle?: string;
  headerExtra?: React.ReactNode;
}

export const Layout = ({
  children,
  onDeviceSelect,
  selectedDevice,
  showHeader = true,
  headerTitle = "BESS Dashboard",
  headerExtra
}: LayoutProps) => {
  const [localSelectedDevice, setLocalSelectedDevice] = useState<string>('');

  const handleDeviceSelect = (deviceId: string) => {
    setLocalSelectedDevice(deviceId);
    onDeviceSelect?.(deviceId);
  };

  const currentDevice = selectedDevice || localSelectedDevice;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar
          onDeviceSelect={handleDeviceSelect}
          selectedDevice={currentDevice}
        />
        <div className="flex-1 flex flex-col">
          {showHeader && (
            <header className="h-16 flex items-center border-b bg-card px-6 shadow-sm">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Logo" className="h-6 w-auto" />
                <span className="font-semibold text-lg text-foreground">{headerTitle}</span>
              </div>
              {headerExtra && (
                <div className="ml-auto">
                  {headerExtra}
                </div>
              )}
            </header>
          )}
          <main className={showHeader ? "flex-1 p-6" : "flex-1"}>
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};