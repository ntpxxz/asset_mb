import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, UserPlus, FileText, Download, Upload, Settings, RotateCcw, ArrowRightLeft } from 'lucide-react';

interface QuickActionsProps {
  onActionClick?: (action: string) => void;
}

export function QuickActions({ onActionClick }: QuickActionsProps) {
  const actions = [
    { name: 'Check-in Asset', icon: RotateCcw, color: 'bg-green-500 hover:bg-green-600', action: 'checkin' },
    { name: 'Transfer Asset', icon: ArrowRightLeft, color: 'bg-purple-500 hover:bg-purple-600', action: 'transfer' },
    { name: 'Generate Report', icon: FileText, color: 'bg-blue-500 hover:bg-blue-600', action: 'report' },
    { name: 'Import Assets', icon: Upload, color: 'bg-orange-500 hover:bg-orange-600', action: 'import' },
    { name: 'Export Data', icon: Download, color: 'bg-teal-500 hover:bg-teal-600', action: 'export' },
    { name: 'System Settings', icon: Settings, color: 'bg-gray-500 hover:bg-gray-600', action: 'settings' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Additional Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.name}
                onClick={() => onActionClick?.(action.action)}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-3 hover:shadow-md transition-all"
              >
                <div className={`p-2 rounded-full text-white ${action.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium text-center leading-tight">{action.name}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}