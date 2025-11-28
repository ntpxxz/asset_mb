// app/components/layout/sidebar.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Package,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Box,
  Laptop,
  BarChart2,
  Home,
  FileText,
  PlusCircle,
  ArrowRightLeft,
  Network,
  Download,
  ChevronDown, // Imported ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';

// Navigation item definition
type NavItem = {
  name: string;
  href: string;
  icon: any;
  submenu?: { name: string; href: string; icon: any }[];
};

// Base navigation
const navigation: NavItem[] = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Computer Assets', href: '/assets/computer', icon: Laptop },
  { name: 'Network Assets', href: '/assets/network', icon: Network },
  {
    name: 'Other Assets',
    href: '/inventory',
    icon: Box,
    submenu: [
      { name: 'Stock', href: '/inventory', icon: Box },
      { name: 'Dashboard', href: '/inventory/dashboard', icon: BarChart2 },
      { name: 'Add New', href: '/inventory/add', icon: PlusCircle },
      { name: 'Transaction', href: '/inventory/transaction', icon: ArrowRightLeft },
      { name: 'Reports', href: '/inventory/reports', icon: FileText },
    ],
  },
  { name: 'Import from Excel', href: '/assets/import', icon: Download },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  // State to track which menus are open. Key is item.name, value is boolean
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  const pathname = usePathname();
  const router = useRouter();

  // Effect to auto-expand submenu if current path is active on mount or navigation
  useEffect(() => {
    const newOpenState = { ...openSubmenus };
    let hasChanges = false;

    navigation.forEach((item) => {
      if (item.submenu) {
        // Check if any child matches the current path
        const isChildActive = item.submenu.some((sub) => pathname === sub.href.split('?')[0]);
        // If child is active and menu is not explicitly open/closed yet (or just force open it)
        if (isChildActive && !openSubmenus[item.name]) {
          newOpenState[item.name] = true;
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      setOpenSubmenus(newOpenState);
    }
  }, [pathname]); // Depend on pathname to auto-open when navigating

  const handleLogout = async () => {
    const tid = toast.loading('Logging out...');
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        toast.success('Logged out successfully', { id: tid });
        router.push('/login');
      } else {
        throw new Error('Failed to logout');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred', { id: tid });
    }
  };

  const toggleSubmenu = (name: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  return (
    <div
      className={cn(
        'bg-card border-r border-border flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="p-6 border-b border-border flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">AssetFlow</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 p-0"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          const hasSubmenu = item.submenu && item.submenu.length > 0;
          const isOpen = openSubmenus[item.name] || false;

          // Determine active state for highlighting
          const isMainActive = pathname === item.href;
          const isChildActive = item.submenu?.some((sub) => pathname === sub.href.split('?')[0]);
          const isActive = isMainActive || isChildActive;

          // Common classes for the menu item container
          const menuItemClasses = cn(
            'flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer w-full',
            isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          );

          // Render Logic:
          // If it has a submenu, we render a button that toggles visibility.
          // If it is a standard link, we render the Link component.
          return (
            <div key={item.name}>
              {hasSubmenu ? (
                <div
                  onClick={() => !collapsed && toggleSubmenu(item.name)}
                  className={menuItemClasses}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span className="font-medium">{item.name}</span>}
                  </div>
                  {/* Toggle Icon */}
                  {!collapsed && (
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        isOpen ? "transform rotate-180" : ""
                      )}
                    />
                  )}
                </div>
              ) : (
                <Link href={item.href}>
                  <div className={menuItemClasses}>
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span className="font-medium">{item.name}</span>}
                    </div>
                  </div>
                </Link>
              )}

              {/* Submenu */}
              {hasSubmenu && !collapsed && (
                <div
                  className={cn(
                    'overflow-hidden transition-all duration-300 ease-in-out',
                    isOpen ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'
                  )}
                >
                  <div className="pl-4 space-y-1">
                    {item.submenu!.map((sub) => {
                      const SubIcon = sub.icon;
                      const isSubActive = pathname === sub.href.split('?')[0];
                      return (
                        <Link key={sub.name} href={sub.href}>
                          <div
                            className={cn(
                              'flex items-center space-x-3 px-3 py-1.5 rounded-md text-sm transition-colors',
                              isSubActive
                                ? 'text-primary font-medium bg-primary/10'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            )}
                          >
                            <SubIcon className="h-4 w-4" />
                            <span>{sub.name}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer – Logout */}
      <div className="p-4 border-t border-border">
        <div
          onClick={handleLogout}
          className={cn(
            'flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium">Logout</span>}
        </div>
      </div>
    </div>
  );
}