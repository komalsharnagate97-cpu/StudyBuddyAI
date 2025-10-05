import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Send, Clock, Smile, Bell } from "lucide-react";
import { Notification } from "@shared/schema";

const notificationSchema = z.object({
  type: z.string().min(1, "Type is required"),
  targetAudience: z.string().min(1, "Target audience is required"),
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  emoji: z.string().optional(),
  scheduledAt: z.string().optional(),
});

type NotificationFormData = z.infer<typeof notificationSchema>;

interface NotificationComposerProps {
  recentNotifications: Notification[];
  onSendNotification: (data: NotificationFormData) => void;
  onScheduleNotification: (data: NotificationFormData) => void;
}

export default function NotificationComposer({ 
  recentNotifications, 
  onSendNotification, 
  onScheduleNotification 
}: NotificationComposerProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      type: "",
      targetAudience: "",
      title: "",
      message: "",
      emoji: "",
      scheduledAt: "",
    },
  });

  const handleSendNow = async (data: NotificationFormData) => {
    setIsLoading(true);
    try {
      await onSendNotification(data);
      form.reset();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSchedule = async (data: NotificationFormData) => {
    setIsLoading(true);
    try {
      await onScheduleNotification(data);
      form.reset();
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      sent: { label: "Sent", color: "bg-green-500/20 text-green-400" },
      scheduled: { label: "Scheduled", color: "bg-yellow-500/20 text-yellow-400" },
      draft: { label: "Draft", color: "bg-gray-500/20 text-gray-400" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Notification Broadcasting</h2>
          <p className="text-muted-foreground">Send notifications to users with emoji support and scheduling</p>
        </div>
        <Button data-testid="button-broadcast">
          <Plus className="w-4 h-4 mr-2" />
          Broadcast Notification
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notification Composer */}
        <Card>
          <CardHeader>
            <CardTitle>Compose Notification</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Notification Type</Label>
                <Select value={form.watch("type")} onValueChange={(value) => form.setValue("type", value)}>
                  <SelectTrigger data-testid="select-notification-type">
                    <SelectValue placeholder="Select notification type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_app">In-App Notification</SelectItem>
                    <SelectItem value="email">Email Notification</SelectItem>
                    <SelectItem value="push">Push Notification</SelectItem>
                    <SelectItem value="all">All Channels</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Select value={form.watch("targetAudience")} onValueChange={(value) => form.setValue("targetAudience", value)}>
                  <SelectTrigger data-testid="select-target-audience">
                    <SelectValue placeholder="Select target audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_users">All Users</SelectItem>
                    <SelectItem value="active_clients">Active Clients</SelectItem>
                    <SelectItem value="leads">Leads Only</SelectItem>
                    <SelectItem value="premium_users">Premium Users</SelectItem>
                    <SelectItem value="custom">Custom Segment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter notification title"
                  {...form.register("title")}
                  data-testid="input-notification-title"
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  rows={4}
                  placeholder="Write your notification message..."
                  {...form.register("message")}
                  data-testid="textarea-notification-message"
                />
                {form.formState.errors.message && (
                  <p className="text-sm text-destructive">{form.formState.errors.message.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="emoji">Emoji</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="emoji"
                    placeholder="Select emoji"
                    {...form.register("emoji")}
                    className="flex-1"
                    data-testid="input-notification-emoji"
                  />
                  <Button type="button" variant="outline" size="sm" data-testid="button-emoji-picker">
                    <Smile className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="schedule">Schedule</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Input 
                    type="date" 
                    data-testid="input-schedule-date"
                  />
                  <Input 
                    type="time" 
                    data-testid="input-schedule-time"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Button 
                  type="button"
                  onClick={form.handleSubmit(handleSendNow)}
                  disabled={isLoading}
                  className="flex-1"
                  data-testid="button-send-now"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Now
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={form.handleSubmit(handleSchedule)}
                  disabled={isLoading}
                  data-testid="button-schedule"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Schedule
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentNotifications.map((notification) => (
                <div key={notification.id} className="flex items-start space-x-3 p-4 bg-accent/50 rounded-lg">
                  <span className="text-2xl" data-testid={`notification-emoji-${notification.id}`}>
                    {notification.emoji || "📢"}
                  </span>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground" data-testid={`notification-title-${notification.id}`}>
                      {notification.title}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1" data-testid={`notification-message-${notification.id}`}>
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted-foreground" data-testid={`notification-date-${notification.id}`}>
                        {formatDate(notification.createdAt)}
                      </span>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(notification.status)}
                        <span className="text-xs text-muted-foreground" data-testid={`notification-recipients-${notification.id}`}>
                          {notification.recipientCount || 0} users
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {recentNotifications.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">No Notifications Yet</h3>
                  <p className="text-muted-foreground">Start by creating your first notification</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
