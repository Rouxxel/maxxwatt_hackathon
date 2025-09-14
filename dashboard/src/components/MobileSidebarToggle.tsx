import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileSidebarToggleProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export const MobileSidebarToggle = ({ isOpen, onToggle, className }: MobileSidebarToggleProps) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      className={cn("md:hidden", className)}
      aria-label="Toggle sidebar"
    >
      {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </Button>
  );
};