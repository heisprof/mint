import { useState } from 'react';
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
  LogOut,
  ChevronLeft,
  ChevronRight
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

export default function CollapsibleSidebar() {
  const [location] = useLocation();
  const { theme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-blue-50 border-r border-blue-200 flex-shrink-0 flex flex-col h-screen transition-all duration-300 ease-in-out relative`}>
      <div className="p-4 border-b border-blue-200 flex justify-between items-center">
        <div className={`flex items-center ${collapsed ? 'justify-center w-full' : ''}`}>
          <Database className="text-blue-600 mr-2" />
          {!collapsed && <h1 className="text-xl font-bold text-blue-800">MINT</h1>}
        </div>
        <button 
          onClick={toggleSidebar} 
          className="bg-blue-100 hover:bg-blue-200 text-blue-600 p-1 rounded absolute -right-4 top-5 z-10 shadow-md"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
      
      {!collapsed && (
        <div className="px-4 py-2 border-b border-blue-200">
          <p className="text-xs text-blue-600 mt-1">
            Monitoring Infrastructure Tool • <a 
              href="https://ubunet.co.za" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-orange-500 hover:underline"
            >
              By Ubuntu Networks
            </a>
          </p>
        </div>
      )}
      
      <nav className="flex-1 overflow-y-auto py-4">
        <ul>
          {mainLinks.map((link) => (
            <li key={link.href} className="mb-1">
              <Link href={link.href}>
                <a
                  className={cn(
                    "flex items-center px-4 py-2 text-sm rounded mx-2 transition-colors duration-200",
                    location === link.href
                      ? "bg-blue-100 text-blue-700" 
                      : "text-blue-600 hover:bg-blue-100"
                  )}
                >
                  <span className={cn("text-blue-600", collapsed ? "" : "mr-3")}>
                    {link.icon}
                  </span>
                  {!collapsed && (
                    <>
                      {link.label}
                      {link.count !== undefined && (
                        <span className="ml-auto bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {link.count}
                        </span>
                      )}
                    </>
                  )}
                </a>
              </Link>
            </li>
          ))}
          
          {!collapsed && (
            <li className="mt-4 mb-2 px-4">
              <h3 className="text-xs font-semibold text-blue-500 uppercase tracking-wider">Configuration</h3>
            </li>
          )}
          
          {configLinks.map((link) => (
            <li key={link.href} className="mb-1">
              <Link href={link.href}>
                <a
                  className={cn(
                    "flex items-center px-4 py-2 text-sm rounded mx-2 transition-colors duration-200",
                    location === link.href
                      ? "bg-blue-100 text-blue-700" 
                      : "text-blue-600 hover:bg-blue-100"
                  )}
                >
                  <span className={cn("text-blue-600", collapsed ? "" : "mr-3")}>
                    {link.icon}
                  </span>
                  {!collapsed && link.label}
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-blue-200">
        <div className={cn("flex items-center", collapsed ? "justify-center" : "")}>
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            A
          </div>
          {!collapsed && (
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800">Admin User</p>
              <p className="text-xs text-blue-500">System Administrator</p>
            </div>
          )}
          {!collapsed && (
            <button className="ml-auto text-blue-500 hover:text-blue-700">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}