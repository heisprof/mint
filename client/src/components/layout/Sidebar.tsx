import React from 'react';
import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  Database, 
  ActivitySquare, 
  Bell, 
  History, 
  Users, 
  FolderClosed, 
  Sliders, 
  Cable, 
  Settings,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/theme';

interface SidebarLink {
  href: string;
  icon: React.ReactNode;
  label: string;
  count?: number;
}

const mainLinks: SidebarLink[] = [
  { href: '/', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { href: '/databases', icon: <Database size={18} />, label: 'Databases' },
  { href: '/system-health', icon: <ActivitySquare size={18} />, label: 'System Health' },
  { href: '/alerts', icon: <Bell size={18} />, label: 'Alerts', count: 4 },
  { href: '/history', icon: <History size={18} />, label: 'History' },
];

const configLinks: SidebarLink[] = [
  { href: '/users', icon: <Users size={18} />, label: 'User Management' },
  { href: '/groups', icon: <FolderClosed size={18} />, label: 'Groups' },
  { href: '/thresholds', icon: <Sliders size={18} />, label: 'Thresholds' },
  { href: '/integrations', icon: <Cable size={18} />, label: 'Integrations' },
  { href: '/settings', icon: <Settings size={18} />, label: 'Settings' },
];

interface SidebarLinkItemProps {
  link: SidebarLink;
  isActive: boolean;
}

const SidebarLinkItem = ({ link, isActive }: SidebarLinkItemProps) => {
  return (
    <li className="mb-1">
      <Link href={link.href}>
        <a
          className={cn(
            "flex items-center px-4 py-2 text-sm rounded mx-2 transition-colors duration-200",
            isActive 
              ? "text-white bg-sidebar-primary" 
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          )}
        >
          <span className="mr-3">{link.icon}</span>
          {link.label}
          {link.count !== undefined && (
            <span className="ml-auto bg-error text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {link.count}
            </span>
          )}
        </a>
      </Link>
    </li>
  );
};

export default function Sidebar() {
  const [location] = useLocation();
  const { theme } = useTheme();

  return (
    <aside className="w-64 bg-sidebar bg-sidebar-background border-r border-sidebar-border flex-shrink-0 flex flex-col h-screen">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center">
          <Database className="text-sidebar-primary mr-2" />
          <h1 className="text-xl font-bold text-sidebar-foreground">MINT</h1>
        </div>
        <p className="text-xs text-sidebar-foreground/60 mt-1">
          Monitoring Infrastructure Tool • <a 
            href="https://ubunet.co.za" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sidebar-primary hover:underline"
          >
            By Ubuntu Networks
          </a>
        </p>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        <ul>
          {mainLinks.map((link) => (
            <SidebarLinkItem
              key={link.href}
              link={link}
              isActive={location === link.href}
            />
          ))}
          
          <li className="mt-4 mb-2 px-4">
            <h3 className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">Configuration</h3>
          </li>
          
          {configLinks.map((link) => (
            <SidebarLinkItem
              key={link.href}
              link={link}
              isActive={location === link.href}
            />
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-sidebar-primary">
            A
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-sidebar-foreground">Admin User</p>
            <p className="text-xs text-sidebar-foreground/60">System Administrator</p>
          </div>
          <button className="ml-auto text-sidebar-foreground/60 hover:text-sidebar-foreground">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
