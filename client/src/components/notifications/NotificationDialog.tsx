import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertNotificationSchema, type Notification, type InsertNotification } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "send" | "schedule";
}

const targetAudiences = [
  { value: "all_users", label: "All Users" },
  { value: "active_clients", label: "Active Clients" },
  { value: "leads", label: "Leads Only" },
  { value: "premium_users", label: "Premium Users" },
  { value: "custom", label: "Custom Segment" },
];

const notificationTypes = [
  { value: "in_app", label: "In-App Only" },
  { value: "email", label: "Email Only" },
  { value: "push", label: "Push Notification" },
  { value: "all", label: "All Channels" },
];

const commonEmojis = ["📢", "🔔", "⚡", "🎉", "💡", "🚀", "💰", "⭐", "🎯", "🔥"];

export default function NotificationDialog({ open, onOpenChange, mode }: NotificationDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertNotification>({
    resolver: zodResolver(insertNotificationSchema),
    defaultValues: {
      type: "all",
      title: "",
      message: "",
      emoji: "📢",
      targetAudience: "all_users",
      status: mode === "send" ? "sent" : "scheduled",
      recipientCount: 0,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        type: "all",
        title: "",
        message: "",
        emoji: "📢",
        targetAudience: "all_users",
        status: mode === "send" ? "sent" : "scheduled",
        recipientCount: 0,
        scheduledAt: mode === "schedule" ? new Date(Date.now() + 60 * 60 * 1000) : undefined, // Default to 1 hour from now
      });
    }
  }, [open, mode, form]);

  const sendMutation = useMutation({
    mutationFn: (data: InsertNotification) => apiRequest("POST", "/api/notifications/send", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Notification Sent",
        description: "Your notification has been sent successfully",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send notification",
        variant: "destructive",
      });
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: (data: InsertNotification) => apiRequest("POST", "/api/notifications/schedule", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Notification Scheduled",
        description: "Your notification has been scheduled successfully",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule notification",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertNotification) => {
    if (mode === "send") {
      sendMutation.mutate({ ...data, status: "sent" });
    } else {
      scheduleMutation.mutate({ ...data, status: "scheduled" });
    }
  };

  const isLoading = sendMutation.isPending || scheduleMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="notification-dialog-title">
            {mode === "send" ? "Send Notification" : "Schedule Notification"}
          </DialogTitle>
          <DialogDescription>
            {mode === "send" 
              ? "Send an immediate notification to your users" 
              : "Schedule a notification to be sent later"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notification Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-notification-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {notificationTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emoji"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emoji</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "📢"}>
                      <FormControl>
                        <SelectTrigger data-testid="select-emoji">
                          <SelectValue placeholder="Select emoji" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {commonEmojis.map((emoji) => (
                          <SelectItem key={emoji} value={emoji}>
                            {emoji} {emoji}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter notification title" 
                      {...field} 
                      data-testid="input-notification-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your notification message"
                      rows={4}
                      {...field}
                      data-testid="input-notification-message"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetAudience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Audience</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-target-audience">
                        <SelectValue placeholder="Select audience" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {targetAudiences.map((audience) => (
                        <SelectItem key={audience.value} value={audience.value}>
                          {audience.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mode === "schedule" && (
              <FormField
                control={form.control}
                name="scheduledAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schedule Date & Time</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        value={field.value ? new Date(field.value.getTime() - field.value.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                        data-testid="input-scheduled-time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                data-testid="button-cancel-notification"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                data-testid="button-send-notification"
              >
                {isLoading ? "Processing..." : (mode === "send" ? "Send Now" : "Schedule")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}