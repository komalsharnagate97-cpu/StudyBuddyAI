import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertAIConfigSchema, type Product, type AIConfig, type InsertAIConfig } from "@shared/schema";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AIConfigDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AIConfigDialog({ product, open, onOpenChange }: AIConfigDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: aiConfigs = [] } = useQuery<AIConfig[]>({
    queryKey: ["/api/ai-config"],
    enabled: open,
  });

  const existingConfig = aiConfigs.find(config => config.productId === product.id);

  const form = useForm<InsertAIConfig>({
    resolver: zodResolver(insertAIConfigSchema),
    defaultValues: {
      productId: product.id,
      isEnabled: false,
      mode: "chat",
      systemPrompt: "",
      welcomeMessage: "",
      fallbackResponse: "",
    },
  });

  useEffect(() => {
    if (existingConfig) {
      form.reset({
        productId: existingConfig.productId || product.id,
        isEnabled: existingConfig.isEnabled || false,
        mode: existingConfig.mode || "chat",
        systemPrompt: existingConfig.systemPrompt || "",
        welcomeMessage: existingConfig.welcomeMessage || "",
        fallbackResponse: existingConfig.fallbackResponse || "",
      });
    } else {
      form.reset({
        productId: product.id,
        isEnabled: false,
        mode: "chat",
        systemPrompt: `You are an AI assistant for ${product.name}. Help customers with questions about this product.`,
        welcomeMessage: `Hello! I'm here to help you with ${product.name}. How can I assist you today?`,
        fallbackResponse: "I'm sorry, I didn't understand that. Could you please rephrase your question?",
      });
    }
  }, [existingConfig, product, form, open]);

  const createOrUpdateMutation = useMutation({
    mutationFn: (data: InsertAIConfig) => {
      if (existingConfig) {
        return apiRequest("PUT", `/api/ai-config/${existingConfig.id}`, data);
      } else {
        return apiRequest("POST", "/api/ai-config", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-config"] });
      toast({
        title: "AI Configuration Saved",
        description: `AI assistant for ${product.name} has been configured successfully`,
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save AI configuration",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertAIConfig) => {
    createOrUpdateMutation.mutate(data);
  };

  const isLoading = createOrUpdateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="ai-dialog-title">
            AI Configuration - {product.name}
          </DialogTitle>
          <DialogDescription>
            Configure the AI assistant settings for this product
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="isEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Enable AI Assistant</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Turn on AI assistant for this product
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                      data-testid="switch-ai-enabled"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AI Mode</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-ai-mode">
                        <SelectValue placeholder="Select AI mode" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="chat">Chat Only</SelectItem>
                      <SelectItem value="voice">Voice Only</SelectItem>
                      <SelectItem value="both">Chat & Voice</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="systemPrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>System Prompt</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Define the AI's role and behavior..."
                      rows={4}
                      {...field}
                      value={field.value || ""}
                      data-testid="input-system-prompt"
                    />
                  </FormControl>
                  <div className="text-sm text-muted-foreground">
                    This defines how the AI should behave and respond to users
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="welcomeMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Welcome Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the initial greeting message..."
                      rows={3}
                      {...field}
                      value={field.value || ""}
                      data-testid="input-welcome-message"
                    />
                  </FormControl>
                  <div className="text-sm text-muted-foreground">
                    First message users see when they start chatting
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fallbackResponse"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fallback Response</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Message when AI doesn't understand..."
                      rows={2}
                      {...field}
                      value={field.value || ""}
                      data-testid="input-fallback-response"
                    />
                  </FormControl>
                  <div className="text-sm text-muted-foreground">
                    Response when the AI cannot understand or answer a question
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                data-testid="button-cancel-ai"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                data-testid="button-save-ai"
              >
                {isLoading ? "Saving..." : "Save Configuration"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}