'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bell, Search, Plus, ChevronDown, Package, Shield, Users, Sun, Moon, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from 'next-themes';
import { useI18n } from '@/lib/i18n-context';

export function Header() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useI18n();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'th' : 'en');
  };

  return (
    <header className="bg-card border-b border-border px-6 py-5">
      <div className="grid grid-cols-3 items-center justify-between">
        <div className="col-span-2 items-start space-x-4">

        </div>
        {/* Search */}
        {/* <div className="col-span-1 items-center space-x-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchPlaceholder')}
              className="pl-10 pr-4"
            />
          </div>
        </div>
*/}
        {/* Actions */}
        <div className="col-span-1 flex justify-end space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLanguage}
            className="rounded-full"
            title={language === 'en' ? t('switchToThai') : 'Switch to English'}
          >
            <span className="font-bold text-xs">{language.toUpperCase()}</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-full"
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">{t('toggleTheme')}</span>
          </Button>

          {/*<DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {t('quickAdd')}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => router.push('/assets/add')}>
                <Package className="h-4 w-4 mr-2" />
                {t('hardwareAsset')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/software/add')}>
                <Shield className="h-4 w-4 mr-2" />
                {t('softwareLicense')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/users/add')}>
                <Users className="h-4 w-4 mr-2" />
                {t('userAccount')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>*/}

          {/*<div className="relative">
            <Button variant="ghost" size="sm" className="p-2">
              <Bell className="h-5 w-5" />
            </Button>
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              3
            </Badge>
          </div>*/}
        </div>
      </div>
    </header>
  );
}