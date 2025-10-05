import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/layouts/AdminLayout";
import MetricCard from "@/components/dashboard/MetricCard";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, DollarSign, TrendingUp, Megaphone, Download } from "lucide-react";

interface DashboardMetrics {
  totalUsers: number;
  revenue: number;
  conversionRate: number;
  activeCampaigns: number;
  userGrowth: string;
  revenueGrowth: string;
  conversionChange: string;
  campaignsStatus: string;
}

export default function Dashboard() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: recentActivity } = useQuery({
    queryKey: ["/api/dashboard/activity"],
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </AdminLayout>
    );
  }

  const dashboardMetrics: DashboardMetrics = (metrics as DashboardMetrics) || {
    totalUsers: 0,
    revenue: 0,
    conversionRate: 0,
    activeCampaigns: 0,
    userGrowth: "0%",
    revenueGrowth: "0%",
    conversionChange: "0%",
    campaignsStatus: "0 new",
  };

  const activityItems = (recentActivity as any[]) || [];

  return (
    <AdminLayout>
      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Users"
          value={dashboardMetrics.totalUsers.toLocaleString()}
          change={dashboardMetrics.userGrowth}
          trend="up"
          icon={Users}
          iconColor="bg-primary/20 text-primary"
        />
        <MetricCard
          title="Revenue"
          value={`₹${dashboardMetrics.revenue.toLocaleString()}`}
          change={dashboardMetrics.revenueGrowth}
          trend="up"
          icon={DollarSign}
          iconColor="bg-green-500/20 text-green-400"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${dashboardMetrics.conversionRate}%`}
          change={dashboardMetrics.conversionChange}
          trend="down"
          icon={TrendingUp}
          iconColor="bg-yellow-500/20 text-yellow-400"
        />
        <MetricCard
          title="Active Campaigns"
          value={dashboardMetrics.activeCampaigns.toString()}
          change={dashboardMetrics.campaignsStatus}
          trend="up"
          icon={Megaphone}
          iconColor="bg-blue-500/20 text-blue-400"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Revenue Analytics</CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">7D</Button>
              <Button variant="ghost" size="sm">30D</Button>
              <Button variant="ghost" size="sm">90D</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="chart-container h-64 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <div className="text-center">
                <TrendingUp className="w-16 h-16 text-primary mb-4 mx-auto" />
                <p className="text-muted-foreground">Revenue Chart</p>
                <p className="text-xs text-muted-foreground mt-1">Chart integration needed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>User Acquisition</CardTitle>
            <Button variant="ghost" size="sm" data-testid="button-export-chart">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </CardHeader>
          <CardContent>
            <div className="chart-container h-64 rounded-lg flex items-center justify-center bg-gradient-to-br from-green-500/10 to-green-500/5">
              <div className="text-center">
                <Users className="w-16 h-16 text-green-400 mb-4 mx-auto" />
                <p className="text-muted-foreground">User Growth Chart</p>
                <p className="text-xs text-muted-foreground mt-1">Interactive chart with export</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <RecentActivity activities={activityItems} />
    </AdminLayout>
  );
}
