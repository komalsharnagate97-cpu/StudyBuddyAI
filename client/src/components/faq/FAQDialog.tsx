import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertFAQSchema, type FAQ, type InsertFAQ } from "@shared/schema";
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

interface FAQDialogProps {
  faq?: FAQ | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const faqCategories = [
  "General",
  "Billing",
  "Technical",
  "Account",
  "Services",
  "Support"
];

export default function FAQDialog({ faq, open, onOpenChange }: FAQDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!faq;

  const form = useForm<InsertFAQ>({
    resolver: zodResolver(insertFAQSchema),
    defaultValues: {
      question: "",
      answer: "",
      category: "General",
      views: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (faq) {
      form.reset({
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        views: faq.views || 0,
        isActive: faq.isActive ?? true,
      });
    } else {
      form.reset({
        question: "",
        answer: "",
        category: "General",
        views: 0,
        isActive: true,
      });
    }
  }, [faq, form]);

  const createMutation = useMutation({
    mutationFn: (data: InsertFAQ) => apiRequest("POST", "/api/faq", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faq"] });
      queryClient.invalidateQueries({ queryKey: ["/api/faq/categories"] });
      toast({
        title: "FAQ Created",
        description: "FAQ has been created successfully",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create FAQ",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InsertFAQ) => apiRequest("PUT", `/api/faq/${faq?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faq"] });
      queryClient.invalidateQueries({ queryKey: ["/api/faq/categories"] });
      toast({
        title: "FAQ Updated",
        description: "FAQ has been updated successfully",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update FAQ",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertFAQ) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="faq-dialog-title">
            {isEditing ? "Edit FAQ" : "Add New FAQ"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update the FAQ details below" 
              : "Create a new frequently asked question"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the frequently asked question"
                      rows={2}
                      {...field}
                      data-testid="input-faq-question"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="answer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Answer</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the detailed answer"
                      rows={5}
                      {...field}
                      data-testid="input-faq-answer"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-faq-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {faqCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
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
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Make this FAQ visible to users
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                        data-testid="switch-faq-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                data-testid="button-cancel-faq"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                data-testid="button-save-faq"
              >
                {isLoading ? "Saving..." : (isEditing ? "Update FAQ" : "Create FAQ")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}