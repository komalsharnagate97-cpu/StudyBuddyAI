import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layouts/AdminLayout";
import ProductsGrid from "@/components/products/ProductsGrid";
import ProductDialog from "@/components/products/ProductDialog";
import AIConfigDialog from "@/components/products/AIConfigDialog";
import CampaignsList from "@/components/campaigns/CampaignsList";
import CampaignDialog from "@/components/campaigns/CampaignDialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Product, Campaign } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function Products() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [aiConfigDialogOpen, setAIConfigDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [campaignDeleteDialogOpen, setCampaignDeleteDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const deleteProductMutation = useMutation({
    mutationFn: (productId: string) => apiRequest("DELETE", `/api/products/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product Deleted",
        description: "Product has been deleted successfully",
      });
      setDeleteDialogOpen(false);
      setSelectedProduct(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: (campaignId: string) => apiRequest("DELETE", `/api/campaigns/${campaignId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "Campaign Deleted",
        description: "Campaign has been deleted successfully",
      });
      setCampaignDeleteDialogOpen(false);
      setSelectedCampaign(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete campaign",
        variant: "destructive",
      });
    },
  });

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductDialogOpen(true);
  };

  const handleConfigureAI = (product: Product) => {
    setSelectedProduct(product);
    setAIConfigDialogOpen(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setProductDialogOpen(true);
  };

  const handleAddCampaign = () => {
    setSelectedCampaign(null);
    setCampaignDialogOpen(true);
  };

  const handleEditCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setCampaignDialogOpen(true);
  };

  const handleDeleteCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setCampaignDeleteDialogOpen(true);
  };

  if (productsLoading || campaignsLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="products" data-testid="tab-products">Products</TabsTrigger>
          <TabsTrigger value="campaigns" data-testid="tab-campaigns">Campaigns</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6">
          <ProductsGrid
            products={products}
            onEditProduct={handleEditProduct}
            onConfigureAI={handleConfigureAI}
            onAddProduct={handleAddProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <CampaignsList
            campaigns={campaigns}
            onAddCampaign={handleAddCampaign}
            onEditCampaign={handleEditCampaign}
            onDeleteCampaign={handleDeleteCampaign}
          />
        </TabsContent>
      </Tabs>

      <ProductDialog
        product={selectedProduct}
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
      />

      {selectedProduct && (
        <AIConfigDialog
          product={selectedProduct}
          open={aiConfigDialogOpen}
          onOpenChange={setAIConfigDialogOpen}
        />
      )}

      <CampaignDialog
        campaign={selectedCampaign}
        open={campaignDialogOpen}
        onOpenChange={setCampaignDialogOpen}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedProduct?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteProductMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedProduct && deleteProductMutation.mutate(selectedProduct.id)}
              disabled={deleteProductMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProductMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={campaignDeleteDialogOpen} onOpenChange={setCampaignDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedCampaign?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteCampaignMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedCampaign && deleteCampaignMutation.mutate(selectedCampaign.id)}
              disabled={deleteCampaignMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCampaignMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
