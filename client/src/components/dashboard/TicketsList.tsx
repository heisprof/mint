import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Ticket {
  id: string;
  title: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedTo: string;
  time: string;
}

interface TicketItemProps {
  ticket: Ticket;
}

function TicketItem({ ticket }: TicketItemProps) {
  const getStatusClass = () => {
    switch (ticket.status) {
      case 'open':
        return 'bg-blue-800 text-blue-100';
      case 'in_progress':
        return 'bg-yellow-800 text-yellow-100';
      case 'resolved':
        return 'bg-green-800 text-green-100';
      case 'closed':
        return 'bg-gray-800 text-gray-100';
    }
  };
  
  const getStatusText = () => {
    switch (ticket.status) {
      case 'open':
        return 'Open';
      case 'in_progress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      case 'closed':
        return 'Closed';
    }
  };
  
  return (
    <div className="border border-border rounded-md p-3 mb-4 last:mb-0">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium">{ticket.id}</h3>
          <p className="text-sm text-muted-foreground mt-1">{ticket.title}</p>
        </div>
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass()}`}>
          {getStatusText()}
        </span>
      </div>
      <div className="flex justify-between mt-3 text-xs text-muted-foreground">
        <div>Assigned: {ticket.assignedTo}</div>
        <div>{ticket.time}</div>
      </div>
    </div>
  );
}

interface TicketsListProps {
  tickets: Ticket[];
  onViewAll: () => void;
}

export default function TicketsList({ tickets, onViewAll }: TicketsListProps) {
  return (
    <Card>
      <CardHeader className="border-b border-border flex flex-row items-center justify-between p-4">
        <CardTitle className="text-lg">Recent Tickets</CardTitle>
        <Button variant="link" size="sm" onClick={onViewAll}>
          View All
        </Button>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <TicketItem key={ticket.id} ticket={ticket} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
