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
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n-context';

// Navigation item definition
type NavItem = {
  nameKey: string; // Translation key
  href: string;
  icon: any;
  submenu?: { nameKey: string; href: string; icon: any }[];
};

// Base navigation
const navigation: NavItem[] = [
  { nameKey: 'home', href: '/dashboard', icon: Home },
  { nameKey: 'computerAssets', href: '/assets/computer', icon: Laptop },
  { nameKey: 'networkAssets', href: '/assets/network', icon: Network },
  {
    nameKey: 'otherAssets',
    href: '/inventory',
    icon: Box,
    submenu: [
      { nameKey: 'stock', href: '/inventory', icon: Box },
      { nameKey: 'dashboard', href: '/inventory/dashboard', icon: BarChart2 },
      { nameKey: 'addNew', href: '/inventory/add', icon: PlusCircle },
      { nameKey: 'transaction', href: '/inventory/transaction', icon: ArrowRightLeft },
      { nameKey: 'reports', href: '/inventory/reports', icon: FileText },
    ],
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();

  // Effect to auto-expand submenu if current path is active on mount or navigation
  useEffect(() => {
    const newOpenState = { ...openSubmenus };
    let hasChanges = false;

    navigation.forEach((item) => {
      if (item.submenu) {
        const isChildActive = item.submenu.some((sub) => pathname === sub.href.split('?')[0]);
        if (isChildActive && !openSubmenus[item.nameKey]) {
          newOpenState[item.nameKey] = true;
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      setOpenSubmenus(newOpenState);
    }
  }, [pathname]);

  const handleLogout = async () => {
    const tid = toast.loading(t('loggingOut'));
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        toast.success(t('loggedOutSuccess'), { id: tid });
        router.push('/login');
      } else {
        throw new Error('Failed to logout');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('errorOccurred'), { id: tid });
    }
  };

  const toggleSubmenu = (nameKey: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [nameKey]: !prev[nameKey],
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
          const isOpen = openSubmenus[item.nameKey] || false;

          const isMainActive = pathname === item.href;
          const isChildActive = item.submenu?.some((sub) => pathname === sub.href.split('?')[0]);
          const isActive = isMainActive || isChildActive;

          const menuItemClasses = cn(
            'flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer w-full',
            isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          );

          return (
            <div key={item.nameKey}>
              {hasSubmenu ? (
                <div
                  onClick={() => !collapsed && toggleSubmenu(item.nameKey)}
                  className={menuItemClasses}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span className="font-medium">{t(item.nameKey)}</span>}
                  </div>
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
                      {!collapsed && <span className="font-medium">{t(item.nameKey)}</span>}
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
                        <Link key={sub.nameKey} href={sub.href}>
                          <div
                            className={cn(
                              'flex items-center space-x-3 px-3 py-1.5 rounded-md text-sm transition-colors',
                              isSubActive
                                ? 'text-primary font-medium bg-primary/10'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            )}
                          >
                            <SubIcon className="h-4 w-4" />
                            <span>{t(sub.nameKey)}</span>
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
          {!collapsed && <span className="font-medium">{t('logout')}</span>}
        </div>
      </div>
    </div>
  );
}