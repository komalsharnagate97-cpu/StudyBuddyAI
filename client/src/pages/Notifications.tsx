import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/layouts/AdminLayout";
import NotificationComposer from "@/components/notifications/NotificationComposer";
import NotificationDialog from "@/components/notifications/NotificationDialog";
import { useToast } from "@/hooks/use-toast";
import { Notification } from "@shared/schema";

export default function Notifications() {
  const { toast } = useToast();
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  const { data: recentNotifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const handleSendNotification = () => {
    setSendDialogOpen(true);
  };

  const handleScheduleNotification = () => {
    setScheduleDialogOpen(true);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading notifications...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <NotificationComposer
        recentNotifications={recentNotifications}
        onSendNotification={handleSendNotification}
        onScheduleNotification={handleScheduleNotification}
      />

      <NotificationDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        mode="send"
      />

      <NotificationDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        mode="schedule"
      />
    </AdminLayout>
  );
}
