import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layouts/AdminLayout";
import FAQManager from "@/components/faq/FAQManager";
import FAQDialog from "@/components/faq/FAQDialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FAQ } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function FAQPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState("General");
  const [faqDialogOpen, setFaqDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null);

  const { data: faqs = [], isLoading } = useQuery<FAQ[]>({
    queryKey: ["/api/faq"],
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/faq/categories"],
  });

  const deleteMutation = useMutation({
    mutationFn: (faqId: string) => apiRequest("DELETE", `/api/faq/${faqId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faq"] });
      queryClient.invalidateQueries({ queryKey: ["/api/faq/categories"] });
      toast({
        title: "FAQ Deleted",
        description: "FAQ has been deleted successfully",
      });
      setDeleteDialogOpen(false);
      setSelectedFAQ(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete FAQ",
        variant: "destructive",
      });
    },
  });

  const handleAddFAQ = () => {
    setSelectedFAQ(null);
    setFaqDialogOpen(true);
  };

  const handleEditFAQ = (faq: FAQ) => {
    setSelectedFAQ(faq);
    setFaqDialogOpen(true);
  };

  const handleDeleteFAQ = (faq: FAQ) => {
    setSelectedFAQ(faq);
    setDeleteDialogOpen(true);
  };

  const handleAddCategory = () => {
    toast({
      title: "Add Category",
      description: "Category creation functionality to be implemented",
    });
  };

  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading FAQs...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Mock categories if none are loaded
  const faqCategories = (categories as any[]).length > 0 ? (categories as any[]) : [
    { name: "General", count: 5, isActive: selectedCategory === "General" },
    { name: "Billing", count: 3, isActive: selectedCategory === "Billing" },
    { name: "Technical", count: 7, isActive: selectedCategory === "Technical" },
    { name: "Account", count: 2, isActive: selectedCategory === "Account" },
  ];

  // Filter FAQs by selected category
  const filteredFAQs = selectedCategory === "all" 
    ? faqs 
    : faqs.filter((faq: FAQ) => faq.category === selectedCategory);

  return (
    <AdminLayout>
      <FAQManager
        faqs={filteredFAQs}
        categories={faqCategories}
        onAddFAQ={handleAddFAQ}
        onEditFAQ={handleEditFAQ}
        onDeleteFAQ={handleDeleteFAQ}
        onAddCategory={handleAddCategory}
        onSelectCategory={handleSelectCategory}
        selectedCategory={selectedCategory}
      />

      <FAQDialog
        faq={selectedFAQ}
        open={faqDialogOpen}
        onOpenChange={setFaqDialogOpen}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete FAQ</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this FAQ? This action cannot be undone.
              <br />
              <strong>Question:</strong> {selectedFAQ?.question}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedFAQ && deleteMutation.mutate(selectedFAQ.id)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
