import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Download, Plus, Search, Edit, MoreVertical } from "lucide-react";
import { User } from "@shared/schema";

interface ClientsTableProps {
  clients: User[];
  onExport: () => void;
  onAddClient: () => void;
  onEditClient: (client: User) => void;
  onWhatsAppContact: (client: User) => void;
}

export default function ClientsTable({ 
  clients, 
  onExport, 
  onAddClient, 
  onEditClient, 
  onWhatsAppContact 
}: ClientsTableProps) {
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    status: "all",
    source: "all",
    search: "",
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: "Active Client", color: "bg-green-500/20 text-green-400" },
      inactive: { label: "Lead", color: "bg-yellow-500/20 text-yellow-400" },
      suspended: { label: "Suspended", color: "bg-red-500/20 text-red-400" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClients(clients.map(client => client.id));
    } else {
      setSelectedClients([]);
    }
  };

  const handleSelectClient = (clientId: string, checked: boolean) => {
    if (checked) {
      setSelectedClients([...selectedClients, clientId]);
    } else {
      setSelectedClients(selectedClients.filter(id => id !== clientId));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Client & Lead Management</h2>
          <p className="text-muted-foreground">Manage your clients, leads, and follow-up activities</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={onExport} data-testid="button-export">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={onAddClient} data-testid="button-add-client">
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
              <SelectTrigger data-testid="select-status">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Lead</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filters.source} onValueChange={(value) => setFilters({...filters, source: value})}>
              <SelectTrigger data-testid="select-source">
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="social_media">Social Media</SelectItem>
              </SelectContent>
            </Select>
            
            <Input 
              type="date" 
              className="w-full"
              data-testid="input-date-filter"
            />
            
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="pl-10"
                data-testid="input-search-clients"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedClients.length === clients.length}
                    onCheckedChange={handleSelectAll}
                    data-testid="checkbox-select-all"
                  />
                </TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Last Contact</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id} className="hover:bg-accent/50">
                  <TableCell>
                    <Checkbox
                      checked={selectedClients.includes(client.id)}
                      onCheckedChange={(checked) => handleSelectClient(client.id, checked as boolean)}
                      data-testid={`checkbox-client-${client.id}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>
                          {client.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground" data-testid={`client-name-${client.id}`}>
                          {client.name}
                        </p>
                        <p className="text-xs text-muted-foreground" data-testid={`client-email-${client.id}`}>
                          {client.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(client.status)}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground" data-testid={`client-source-${client.id}`}>
                      {client.source || "Website"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground" data-testid={`client-last-contact-${client.id}`}>
                      {client.lastContact ? new Date(client.lastContact).toLocaleDateString() : "Never"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium text-foreground" data-testid={`client-value-${client.id}`}>
                      ₹{Number(client.value || 0).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onWhatsAppContact(client)}
                        className="text-green-400 hover:bg-green-500/20"
                        data-testid={`button-whatsapp-${client.id}`}
                      >
                        <i className="fab fa-whatsapp text-sm"></i>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditClient(client)}
                        className="text-blue-400 hover:bg-blue-500/20"
                        data-testid={`button-edit-${client.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground hover:bg-accent"
                        data-testid={`button-more-${client.id}`}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        <div className="border-t border-border p-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing 1-{clients.length} of {clients.length} clients
          </p>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" disabled data-testid="button-previous">
              Previous
            </Button>
            <Button size="sm" data-testid="button-page-1">1</Button>
            <Button variant="outline" size="sm" disabled data-testid="button-next">
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
