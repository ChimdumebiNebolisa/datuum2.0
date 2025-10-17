'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { 
  Menu, 
  X, 
  Settings, 
  Download, 
  Save, 
  FolderOpen 
} from 'lucide-react';
import { logger } from '@/lib/logger';

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { icon: FolderOpen, label: 'Open', action: () => logger.info('Open action triggered') },
    { icon: Save, label: 'Save', action: () => logger.info('Save action triggered') },
    { icon: Download, label: 'Export', action: () => logger.info('Export action triggered') },
    { icon: Settings, label: 'Settings', action: () => logger.info('Settings action triggered') },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden" aria-label="Open navigation menu">
          <Menu className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Menu</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
              aria-label="Close navigation menu"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            {navItems.map((item, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  item.action();
                  setIsOpen(false);
                }}
                aria-label={`${item.label} action`}
              >
                <item.icon className="h-4 w-4 mr-2" aria-hidden="true" />
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}