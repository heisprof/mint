import React from 'react';
import { Search, HelpCircle, Bell, SunMoon, Moon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/theme';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  
  return (
    <header className="bg-card shadow-md px-6 py-3 flex items-center justify-between">
      <div className="flex items-center">
        <h1 className="text-xl font-medium">{title}</h1>
      </div>
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 w-[200px] bg-muted border-0 focus:ring-1 focus:ring-primary"
          />
        </div>
        <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground">
          <HelpCircle className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-3 w-3 bg-error rounded-full border-2 border-card"></span>
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground" onClick={toggleTheme}>
          {theme === 'dark' ? <SunMoon className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>
    </header>
  );
}
