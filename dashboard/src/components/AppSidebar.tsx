import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDevices } from '../hooks/useDevices';
import { Button } from '@/components/ui/button';
import { PanelLeftClose, PanelLeftOpen, Circle, ChevronDown, Moon, Sun, Home, Battery, TrendingUp, FileText, BarChart3 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Card } from '@/components/ui/card';

interface AppSidebarProps {
  onDeviceSelect?: (deviceId: string) => void;
  selectedDevice?: string;
}

export const AppSidebar = ({ onDeviceSelect, selectedDevice }: AppSidebarProps) => {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === 'collapsed';
  // Static single device instead of API call
  const staticDevice = { device_id: 'ZHPESS232A230002', available_metrics: ['bms', 'pcs', 'aux'], total_rows_per_metric: { bms: 1000 } };
  const navigate = useNavigate();
  const location = useLocation();
  const [localSelectedDevice, setLocalSelectedDevice] = useState<string>('');
  const [devicesExpanded, setDevicesExpanded] = useState<boolean>(false); // Start collapsed
  const [navigationExpanded, setNavigationExpanded] = useState<boolean>(false); // Start collapsed
  const [isDark, setIsDark] = useState<boolean>(document.body.classList.contains('dark'));

  const handleDeviceSelect = (deviceId: string) => {
    setLocalSelectedDevice(deviceId);
    onDeviceSelect?.(deviceId);
    navigate(`/device/${deviceId}`);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDark;
    setIsDark(newDarkMode);
    if (newDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  };

  const navigationItems = [
    { path: '/', label: 'Overview', icon: <Home className="h-4 w-4" /> },
    { path: '/forecast', label: 'Forecast', icon: <TrendingUp className="h-4 w-4" /> },
    { path: '/report', label: 'Report', icon: <FileText className="h-4 w-4" /> },
  ];
  const deviceLinks = [
    { path: '/device/ZHPESS232A230002', label: 'ZHPESS232A230002' },
    { path: '/device/ZHPESS232A230003', label: 'ZHPESS232A230003' },
    { path: '/device/ZHPESS232A230007', label: 'ZHPESS232A230007' },
  ];

  const currentDevice = selectedDevice || localSelectedDevice;

  // No loading state needed, device list is static

  return (
    <Sidebar className={collapsed ? 'w-14' : 'w-80'} collapsible="icon">
      <SidebarHeader className="border-b">
        <div className={`flex items-center p-2 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className="h-6 w-auto" />
              <span className="font-semibold text-sm">Device Fleet</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            {!collapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className="h-8 w-8 hover:bg-sidebar-accent"
                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDark ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-8 w-8 hover:bg-sidebar-accent"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-4">
        {!collapsed && (
          <>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {/* Overview */}
                  {navigationItems.filter(item => item.label === 'Overview').map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          onClick={() => navigate(item.path)}
                          className={`w-full justify-start ${
                            isActive
                              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                              : 'hover:bg-sidebar-accent/50'
                          }`}
                        >
                          <span className="mr-2">{item.icon}</span>
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                  {/* Devices Dropdown */}
                  <SidebarMenuItem>
                    <Collapsible open={devicesExpanded} onOpenChange={setDevicesExpanded}>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="w-full justify-start">
                          <span className="mr-2"><Battery className="h-4 w-4" /></span>
                          <span>Devices</span>
                          <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${devicesExpanded ? 'rotate-180' : ''}`} />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenu className="ml-4">
                          {deviceLinks.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                              <SidebarMenuItem key={item.path}>
                                <SidebarMenuButton
                                  onClick={() => navigate(item.path)}
                                  className={`w-full justify-start ${
                                    isActive
                                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                      : 'hover:bg-sidebar-accent/50'
                                  }`}
                                >
                                  <span>{item.label}</span>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            );
                          })}
                        </SidebarMenu>
                      </CollapsibleContent>
                    </Collapsible>
                  </SidebarMenuItem>
                  {/* Other nav items */}
                  {navigationItems.filter(item => item.label !== 'Overview').map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          onClick={() => navigate(item.path)}
                          className={`w-full justify-start ${
                            isActive
                              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                              : 'hover:bg-sidebar-accent/50'
                          }`}
                        >
                          <span className="mr-2">{item.icon}</span>
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
};