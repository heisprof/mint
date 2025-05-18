import React from 'react';
import { Database } from '@shared/schema';
import { Database as DatabaseIcon, MoreVertical, RefreshCw } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/common/StatusBadge';
import ProgressBar from '@/components/common/ProgressBar';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DatabaseItemProps {
  database: Database;
  cpu: number;
  diskUsage: number;
  connections: {
    active: number;
    max: number;
  };
  onDetailsClick: (db: Database) => void;
}

function DatabaseItem({ database, cpu, diskUsage, connections, onDetailsClick }: DatabaseItemProps) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center">
          <DatabaseIcon className="text-primary mr-2" size={18} />
          <div>
            <div className="text-sm font-medium">{database.name}</div>
            <div className="text-xs text-muted-foreground font-mono">
              {database.host}:{database.port}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <StatusBadge status={database.status as any} />
      </TableCell>
      <TableCell>
        <div className="text-sm">{cpu}%</div>
        <ProgressBar value={cpu} className="w-24 mt-1" />
      </TableCell>
      <TableCell>
        <div className="text-sm">{diskUsage}%</div>
        <ProgressBar value={diskUsage} className="w-24 mt-1" />
      </TableCell>
      <TableCell className="text-sm">
        {database.status === 'critical' && connections.active === 0 ? (
          <>
            <div className="text-error">0 / {connections.max}</div>
            <div className="text-xs text-error">Connection Error</div>
          </>
        ) : (
          <>
            <div>{connections.active} / {connections.max}</div>
            <div className="text-xs text-muted-foreground">Active / Max</div>
          </>
        )}
      </TableCell>
      <TableCell className="text-right text-sm font-medium">
        <Button variant="link" onClick={() => onDetailsClick(database)}>
          Details
        </Button>
      </TableCell>
    </TableRow>
  );
}

interface DatabaseTableProps {
  databases: Array<Database & {
    cpu: number;
    diskUsage: number;
    connections: {
      active: number;
      max: number;
    };
  }>;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  onDetailsClick: (db: Database) => void;
}

export default function DatabaseTable({ 
  databases, 
  currentPage, 
  totalPages,
  onPageChange,
  onRefresh,
  onDetailsClick
}: DatabaseTableProps) {
  return (
    <Card className="col-span-2">
      <CardHeader className="border-b border-border flex flex-row items-center justify-between p-4">
        <CardTitle className="text-lg">Database Status</CardTitle>
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-foreground"
            onClick={onRefresh}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="text-xs uppercase">Database</TableHead>
              <TableHead className="text-xs uppercase">Status</TableHead>
              <TableHead className="text-xs uppercase">CPU</TableHead>
              <TableHead className="text-xs uppercase">Disk Usage</TableHead>
              <TableHead className="text-xs uppercase">Connections</TableHead>
              <TableHead className="text-xs uppercase text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {databases.map((db) => (
              <DatabaseItem 
                key={db.id} 
                database={db} 
                cpu={db.cpu}
                diskUsage={db.diskUsage}
                connections={db.connections}
                onDetailsClick={onDetailsClick}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="px-4 py-3 border-t border-border flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium">{databases.length}</span> of <span className="font-medium">{totalPages * 5}</span> databases
          </p>
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => onPageChange(Math.max(1, currentPage - 1))} 
                disabled={currentPage === 1}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink 
                  isActive={currentPage === page}
                  onClick={() => onPageChange(page)}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext 
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} 
                disabled={currentPage === totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </Card>
  );
}
