'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Package,
  Activity,
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
  Monitor,
  Network
} from 'lucide-react';
import { toast } from 'sonner';

// Define the structure for navigation items
type NavItem = {
  name: string;
  href: string;
  icon: any;
  submenu?: { name: string; href: string; icon: any }[];
};

const navigation: NavItem[] = [
  { name: 'Home', href: '/dashboard', icon: Home },
  {
    name: 'Computers & Network',
    href: '/assets',
    icon: Laptop,
    submenu: [
      { name: 'Computers', href: '/assets?type=desktop', icon: Monitor }, // Linking to desktops/laptops via query param
      { name: 'Network', href: '/assets?type=switch', icon: Network }, // Linking to network devices via query param
    ]
  },
  { name: 'Borrowing', href: '/borrowing', icon: Activity },
  {
    name: 'Hardware',
    href: '/inventory',
    icon: Box,
    submenu: [
      { name: 'Stock Items', href: '/inventory', icon: Box },
      { name: 'Dashboard', href: '/inventory/dashboard', icon: BarChart2 },
      { name: 'Add Stock', href: '/inventory/add', icon: PlusCircle },
      { name: 'New Transaction', href: '/inventory/transaction', icon: ArrowRightLeft },
      { name: 'Reports', href: '/inventory/reports', icon: FileText },
    ]
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

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
  }

  return (
    <div className={cn(
      "bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">AssetFlow</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 p-0"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          // Check if current path matches main item or any submenu item
          const isMainActive = pathname === item.href;
          const isChildActive = item.submenu?.some(sub => pathname === sub.href.split('?')[0]); // Ignore query params for active check
          const isActive = isMainActive || isChildActive;

          return (
            <div key={item.name}>
              <Link href={item.href}>
                <div className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}>
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span className="font-medium">{item.name}</span>}
                </div>
              </Link>

              {/* Render Submenu if exists and not collapsed */}
              {item.submenu && !collapsed && (
                <div className={cn(
                  "pl-4 pt-1 space-y-1 overflow-hidden transition-all",
                  // Show submenu if parent is active or it's the Inventory/Hardware section to allow easy access
                  isActive ? "block" : "hidden"
                )}>
                  {item.submenu.map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = pathname === sub.href.split('?')[0];

                    return (
                      <Link key={sub.name} href={sub.href}>
                        <div className={cn(
                          "flex items-center space-x-3 px-3 py-1.5 rounded-md text-sm transition-colors",
                          isSubActive
                            ? "text-blue-700 font-medium bg-blue-50/50"
                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                        )}>
                          <SubIcon className="h-4 w-4" />
                          <span>{sub.name}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer with Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <div
          onClick={handleLogout}
          className={cn(
            "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium">Logout</span>}
        </div>
      </div>
    </div>
  );
}