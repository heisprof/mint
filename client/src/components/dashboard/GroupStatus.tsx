import React from 'react';
import { Group } from '@shared/schema';
import { FolderClosed, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GroupItemProps {
  group: Group & {
    databaseCount: number;
    healthyCounts: {
      healthy: number;
      warning: number;
      critical: number;
    };
  };
}

function GroupItem({ group }: GroupItemProps) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <FolderClosed className="text-primary mr-2" size={18} />
          <h3 className="font-medium">{group.name}</h3>
        </div>
        <div className="text-xs text-muted-foreground">{group.databaseCount} databases</div>
      </div>
      <div className="pl-7 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm">Healthy</div>
          <div className="text-sm">{group.healthyCounts.healthy}</div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm text-warning">Warning</div>
          <div className="text-sm text-warning">{group.healthyCounts.warning}</div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm text-error">Critical</div>
          <div className="text-sm text-error">{group.healthyCounts.critical}</div>
        </div>
      </div>
    </div>
  );
}

interface GroupStatusProps {
  groups: Array<Group & {
    databaseCount: number;
    healthyCounts: {
      healthy: number;
      warning: number;
      critical: number;
    };
  }>;
  onAddGroup: () => void;
}

export default function GroupStatus({ groups, onAddGroup }: GroupStatusProps) {
  return (
    <Card>
      <CardHeader className="border-b border-border flex flex-row items-center justify-between p-4">
        <CardTitle className="text-lg">Database Groups</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          onClick={onAddGroup}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-4">
        {groups.map((group) => (
          <GroupItem key={group.id} group={group} />
        ))}
      </CardContent>
    </Card>
  );
}
