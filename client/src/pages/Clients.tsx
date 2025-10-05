import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layouts/AdminLayout";
import ClientsTable from "@/components/clients/ClientsTable";
import ClientDialog from "@/components/clients/ClientDialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";

export default function Clients() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<User | null>(null);

  const { data: clients = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/clients"],
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/clients/export", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `clients-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        title: "Export Successful",
        description: "Clients data has been exported to CSV",
      });
    },
    onError: () => {
      toast({
        title: "Export Failed",
        description: "Failed to export clients data",
        variant: "destructive",
      });
    },
  });

  const handleExport = () => {
    exportMutation.mutate();
  };

  const handleAddClient = () => {
    setSelectedClient(null);
    setClientDialogOpen(true);
  };

  const handleEditClient = (client: User) => {
    setSelectedClient(client);
    setClientDialogOpen(true);
  };

  const handleWhatsAppContact = (client: User) => {
    if (client.phone) {
      const message = encodeURIComponent(`Hello ${client.name}, I hope you're doing well!`);
      const whatsappUrl = `https://wa.me/${client.phone}?text=${message}`;
      window.open(whatsappUrl, "_blank");
    } else {
      toast({
        title: "No Phone Number",
        description: "This client doesn't have a phone number on file",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading clients...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <ClientsTable
        clients={clients}
        onExport={handleExport}
        onAddClient={handleAddClient}
        onEditClient={handleEditClient}
        onWhatsAppContact={handleWhatsAppContact}
      />

      <ClientDialog
        client={selectedClient}
        open={clientDialogOpen}
        onOpenChange={setClientDialogOpen}
      />
    </AdminLayout>
  );
}
