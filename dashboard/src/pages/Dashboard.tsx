import { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '../components/AppSidebar';


const Dashboard = () => {
  // No device data or loading on dashboard

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 flex items-center border-b bg-card px-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-lg text-foreground">BESS Dashboard</span>
            </div>
            {/* No connection status on dashboard */}
          </header>
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-muted-foreground text-lg">Select a device from the Device page to view data.</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;