import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Folder, Plus, Edit, Trash, Eye } from "lucide-react";
import { FAQ } from "@shared/schema";

interface FAQCategory {
  name: string;
  count: number;
  isActive: boolean;
}

interface FAQManagerProps {
  faqs: FAQ[];
  categories: FAQCategory[];
  onAddFAQ: () => void;
  onEditFAQ: (faq: FAQ) => void;
  onDeleteFAQ: (faq: FAQ) => void;
  onAddCategory: () => void;
  onSelectCategory: (category: string) => void;
  selectedCategory: string;
}

export default function FAQManager({ 
  faqs, 
  categories, 
  onAddFAQ, 
  onEditFAQ, 
  onDeleteFAQ, 
  onAddCategory,
  onSelectCategory,
  selectedCategory 
}: FAQManagerProps) {
  const getCategoryBadge = (category: string) => {
    const categoryColors = {
      General: "bg-blue-500/20 text-blue-400",
      Billing: "bg-green-500/20 text-green-400",
      Technical: "bg-purple-500/20 text-purple-400",
      Account: "bg-yellow-500/20 text-yellow-400",
    };
    
    const color = categoryColors[category as keyof typeof categoryColors] || "bg-gray-500/20 text-gray-400";
    return <Badge className={color}>{category}</Badge>;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">FAQ Management</h2>
          <p className="text-muted-foreground">Organize and manage frequently asked questions by category</p>
        </div>
        <Button onClick={onAddFAQ} data-testid="button-add-faq">
          <Plus className="w-4 h-4 mr-2" />
          Add FAQ
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories Sidebar */}
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.name}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    category.isActive || selectedCategory === category.name
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-accent text-muted-foreground"
                  }`}
                  onClick={() => onSelectCategory(category.name)}
                  data-testid={`category-${category.name.toLowerCase()}`}
                >
                  <div className="flex items-center space-x-3">
                    <Folder className="w-4 h-4" />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {category.count}
                  </Badge>
                </div>
              ))}
            </div>
            
            <Button 
              variant="outline" 
              className="w-full mt-4" 
              onClick={onAddCategory}
              data-testid="button-add-category"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </CardContent>
        </Card>

        {/* FAQ List */}
        <div className="lg:col-span-2 space-y-4">
          {faqs.map((faq) => (
            <Card key={faq.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2" data-testid={`faq-question-${faq.id}`}>
                      {faq.question}
                    </h3>
                    <p className="text-sm text-muted-foreground" data-testid={`faq-answer-${faq.id}`}>
                      {faq.answer}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {getCategoryBadge(faq.category)}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onEditFAQ(faq)}
                      data-testid={`button-edit-faq-${faq.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onDeleteFAQ(faq)}
                      className="text-destructive hover:text-destructive"
                      data-testid={`button-delete-faq-${faq.id}`}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span data-testid={`faq-updated-${faq.id}`}>
                    Last updated: {formatDate(faq.updatedAt)}
                  </span>
                  <div className="flex items-center space-x-1">
                    <Eye className="w-3 h-3" />
                    <span data-testid={`faq-views-${faq.id}`}>Views: {faq.views || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {faqs.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No FAQs Yet</h3>
                <p className="text-muted-foreground mb-4">Start by adding your first FAQ to help users</p>
                <Button onClick={onAddFAQ} data-testid="button-add-first-faq">
                  Add Your First FAQ
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
