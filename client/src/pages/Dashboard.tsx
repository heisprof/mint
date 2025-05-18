import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import StatsCards from '@/components/dashboard/StatsCards';
import DatabaseTable from '@/components/dashboard/DatabaseTable';
import AlertsList from '@/components/dashboard/AlertsList';
import GroupStatus from '@/components/dashboard/GroupStatus';
import TicketsList from '@/components/dashboard/TicketsList';
import AddDatabaseForm from '@/components/forms/AddDatabaseForm';
import DatabaseDetailsDialog from '@/components/dashboard/DatabaseDetailsDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { useDatabases } from '@/hooks/useDatabases';
import { useAlerts } from '@/hooks/useAlerts';
import { useGroups } from '@/hooks/useGroups';
import { useTickets } from '@/hooks/useTickets';
import { Database } from '@shared/schema';

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDatabase, setSelectedDatabase] = useState<(Database & any) | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  
  // Fetch data
  const { 
    databases, 
    databasesWithMetrics, 
    isLoading: isLoadingDatabases, 
    stats,
    refreshDatabases
  } = useDatabases();
  
  const { alerts, isLoading: isLoadingAlerts } = useAlerts();
  const { groups, isLoading: isLoadingGroups } = useGroups();
  const { tickets, isLoading: isLoadingTickets } = useTickets();
  
  // Handle pagination for databases table
  const pageSize = 5;
  const totalPages = Math.ceil((databasesWithMetrics?.length || 0) / pageSize);
  const paginatedDatabases = databasesWithMetrics?.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  
  // Handle database details dialog
  const handleDatabaseDetails = (database: Database) => {
    // Find the database with metrics
    const dbWithMetrics = databasesWithMetrics?.find(db => db.id === database.id);
    if (dbWithMetrics) {
      setSelectedDatabase(dbWithMetrics);
      setDetailsDialogOpen(true);
    }
  };
  
  const handleEditDatabase = (database: Database) => {
    navigate(`/databases?edit=${database.id}`);
  };
  
  const handleViewReports = (database: Database) => {
    navigate(`/system-health?database=${database.id}`);
  };
  
  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Dashboard Overview" />
      
      <div className="p-6">
        {/* Alert Banner */}
        {stats.criticalIssues > 0 && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Critical Alerts Detected</AlertTitle>
            <AlertDescription>
              {stats.criticalIssues} databases have critical alerts that require your attention.{' '}
              <Button 
                variant="link" 
                className="p-0 h-auto text-error hover:text-error/80" 
                onClick={() => navigate("/alerts")}
              >
                View all alerts
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Stats Cards */}
        <StatsCards 
          totalDatabases={stats.total}
          criticalIssues={stats.criticalIssues}
          warnings={stats.warnings}
          healthy={stats.healthy}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Database Status Panel */}
          <DatabaseTable 
            databases={paginatedDatabases || []}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onRefresh={refreshDatabases}
            onDetailsClick={handleDatabaseDetails}
          />
          
          {/* Alerts Panel */}
          <AlertsList 
            alerts={alerts || []}
            onViewAll={() => navigate("/alerts")}
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Group Status Panel */}
          <GroupStatus 
            groups={groups || []}
            onAddGroup={() => navigate("/groups?new=true")}
          />
          
          {/* Tickets Panel */}
          <TicketsList 
            tickets={tickets || []}
            onViewAll={() => navigate("/integrations?tab=tickets")}
          />
          
          {/* Add Database Panel */}
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="text-lg">Add Database</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <AddDatabaseForm 
                databaseTypes={[
                  { id: 1, name: 'Oracle', defaultPort: 1521 },
                  { id: 2, name: 'MySQL', defaultPort: 3306 },
                  { id: 3, name: 'PostgreSQL', defaultPort: 5432 },
                  { id: 4, name: 'MSSQL', defaultPort: 1433 }
                ]}
                groups={groups?.map(g => ({ id: g.id, name: g.name })) || []}
              />
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Database Details Dialog */}
      <DatabaseDetailsDialog 
        database={selectedDatabase}
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        onEdit={handleEditDatabase}
        onViewReports={handleViewReports}
      />
    </div>
  );
}
