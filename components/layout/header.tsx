'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bell, Search, Plus, ChevronDown, Package, Shield, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const router = useRouter();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-5">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search assets, users, or serial numbers..."
              className="pl-10 pr-4"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Quick Add
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => router.push('/assets/add')}>
                <Package className="h-4 w-4 mr-2" />
                Hardware Asset
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/software/add')}>
                <Shield className="h-4 w-4 mr-2" />
                Software License
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/users/add')}>
                <Users className="h-4 w-4 mr-2" />
                User Account
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
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