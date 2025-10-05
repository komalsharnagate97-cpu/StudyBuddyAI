import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Settings, Plus, MoreVertical, Trash2 } from "lucide-react";
import { Product } from "@shared/schema";

interface ProductsGridProps {
  products: Product[];
  onEditProduct: (product: Product) => void;
  onConfigureAI: (product: Product) => void;
  onAddProduct: () => void;
  onDeleteProduct?: (product: Product) => void;
}

export default function ProductsGrid({ 
  products, 
  onEditProduct, 
  onConfigureAI, 
  onAddProduct,
  onDeleteProduct
}: ProductsGridProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: "Active", color: "bg-green-500/20 text-green-400" },
      draft: { label: "Draft", color: "bg-yellow-500/20 text-yellow-400" },
      inactive: { label: "Inactive", color: "bg-red-500/20 text-red-400" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Product & Campaign Management</h2>
          <p className="text-muted-foreground">Manage your products, AI assistants, and marketing campaigns</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" data-testid="button-ai-config">
            <Settings className="w-4 h-4 mr-2" />
            AI Config
          </Button>
          <Button onClick={onAddProduct} data-testid="button-add-product">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Product Management Tabs */}
      <Card>
        <Tabs defaultValue="products" className="w-full">
          <div className="border-b border-border">
            <TabsList className="p-6 bg-transparent">
              <TabsTrigger value="products" data-testid="tab-products">Products</TabsTrigger>
              <TabsTrigger value="ai" data-testid="tab-ai">AI Assistants</TabsTrigger>
              <TabsTrigger value="campaigns" data-testid="tab-campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="landing" data-testid="tab-landing">Landing Pages</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="products" className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="bg-accent/50 border border-border">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(product.status)}
                        <Button variant="ghost" size="sm" data-testid={`button-menu-${product.id}`}>
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2" data-testid={`product-name-${product.id}`}>
                      {product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4" data-testid={`product-description-${product.id}`}>
                      {product.description || "No description available"}
                    </p>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-foreground" data-testid={`product-price-${product.id}`}>
                        ₹{Number(product.price).toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground" data-testid={`product-sales-${product.id}`}>
                        {product.sales || 0} sales
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => onEditProduct(product)}
                        data-testid={`button-edit-product-${product.id}`}
                      >
                        Edit Product
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onConfigureAI(product)}
                        data-testid={`button-ai-product-${product.id}`}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      {onDeleteProduct && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onDeleteProduct(product)}
                          className="text-destructive hover:bg-destructive/10"
                          data-testid={`button-delete-product-${product.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add New Product Card */}
              <Card className="bg-accent/30 border-2 border-dashed border-border">
                <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
                    <Plus className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Add New Product</h3>
                  <p className="text-sm text-muted-foreground mb-4">Create a new product with AI assistant</p>
                  <Button onClick={onAddProduct} data-testid="button-create-product">
                    Create Product
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="p-6">
            <div className="text-center py-12">
              <Settings className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">AI Assistant Configuration</h3>
              <p className="text-muted-foreground mb-4">Configure AI assistants for your products</p>
              <Button data-testid="button-configure-ai">Configure AI Assistants</Button>
            </div>
          </TabsContent>

          <TabsContent value="campaigns" className="p-6">
            <div className="text-center py-12">
              <i className="fas fa-bullhorn text-4xl text-muted-foreground mb-4"></i>
              <h3 className="text-lg font-semibold text-foreground mb-2">Marketing Campaigns</h3>
              <p className="text-muted-foreground mb-4">Create and manage your marketing campaigns</p>
              <Button data-testid="button-create-campaign">Create Campaign</Button>
            </div>
          </TabsContent>

          <TabsContent value="landing" className="p-6">
            <div className="text-center py-12">
              <i className="fas fa-file-alt text-4xl text-muted-foreground mb-4"></i>
              <h3 className="text-lg font-semibold text-foreground mb-2">Landing Page Builder</h3>
              <p className="text-muted-foreground mb-4">Build custom landing pages for your products</p>
              <Button data-testid="button-build-landing">Build Landing Page</Button>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
