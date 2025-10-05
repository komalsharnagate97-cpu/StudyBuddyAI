import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Users, Target, Edit, Trash } from "lucide-react";
import { Campaign } from "@shared/schema";

interface CampaignsListProps {
  campaigns: Campaign[];
  onAddCampaign: () => void;
  onEditCampaign: (campaign: Campaign) => void;
  onDeleteCampaign: (campaign: Campaign) => void;
}

export default function CampaignsList({ 
  campaigns, 
  onAddCampaign, 
  onEditCampaign, 
  onDeleteCampaign 
}: CampaignsListProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: "Active", color: "bg-green-500/20 text-green-400" },
      scheduled: { label: "Scheduled", color: "bg-blue-500/20 text-blue-400" },
      paused: { label: "Paused", color: "bg-yellow-500/20 text-yellow-400" },
      completed: { label: "Completed", color: "bg-gray-500/20 text-gray-400" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Not set";
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
          <h3 className="text-lg font-semibold text-foreground">Marketing Campaigns</h3>
          <p className="text-muted-foreground">Create and manage your marketing campaigns</p>
        </div>
        <Button onClick={onAddCampaign} data-testid="button-add-campaign">
          <Plus className="w-4 h-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base" data-testid={`campaign-name-${campaign.id}`}>
                    {campaign.name}
                  </CardTitle>
                  {getStatusBadge(campaign.status)}
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditCampaign(campaign)}
                    data-testid={`button-edit-campaign-${campaign.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteCampaign(campaign)}
                    data-testid={`button-delete-campaign-${campaign.id}`}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground" data-testid={`campaign-description-${campaign.id}`}>
                {campaign.description || "No description provided"}
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium capitalize" data-testid={`campaign-type-${campaign.id}`}>
                    {campaign.type}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Budget:</span>
                  <span className="font-medium" data-testid={`campaign-budget-${campaign.id}`}>
                    ₹{Number(campaign.budget || 0).toLocaleString()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Start Date:</span>
                  <span className="font-medium" data-testid={`campaign-start-${campaign.id}`}>
                    {formatDate(campaign.startDate)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">End Date:</span>
                  <span className="font-medium" data-testid={`campaign-end-${campaign.id}`}>
                    {formatDate(campaign.endDate)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                <div className="text-center">
                  <div className="text-lg font-semibold text-foreground" data-testid={`campaign-spent-${campaign.id}`}>
                    ₹{Number(campaign.spent || 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Amount Spent</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-foreground" data-testid={`campaign-remaining-${campaign.id}`}>
                    ₹{Number((Number(campaign.budget || 0) - Number(campaign.spent || 0))).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Remaining</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {campaigns.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Target className="w-16 h-16 text-muted-foreground mb-4 mx-auto" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No campaigns yet</h3>
              <p className="text-muted-foreground mb-4">Create your first marketing campaign to start driving growth</p>
              <Button onClick={onAddCampaign}>
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}