import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layouts/AdminLayout";
import WithdrawalsTable from "@/components/referrals/WithdrawalsTable";
import MetricCard from "@/components/dashboard/MetricCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, Clock, DollarSign, Plus } from "lucide-react";
import { Withdrawal } from "@shared/schema";

interface ReferralMetrics {
  totalReferrers: number;
  pendingPayouts: number;
  totalPaid: number;
  referrerGrowth: string;
  pendingCount: number;
  paidCount: number;
}

export default function Referrals() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/referrals/metrics"],
  });

  const { data: withdrawals = [], isLoading: withdrawalsLoading } = useQuery<(Withdrawal & { userName: string; userEmail: string })[]>({
    queryKey: ["/api/withdrawals"],
  });

  const approveMutation = useMutation({
    mutationFn: async (withdrawal: Withdrawal) => {
      const response = await fetch(`/api/withdrawals/${withdrawal.id}/approve`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to approve withdrawal");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/referrals/metrics"] });
      toast({
        title: "Withdrawal Approved",
        description: "The withdrawal request has been approved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Approval Failed",
        description: "Failed to approve the withdrawal request",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (withdrawal: Withdrawal) => {
      const response = await fetch(`/api/withdrawals/${withdrawal.id}/reject`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Insufficient documentation" }),
      });
      if (!response.ok) throw new Error("Failed to reject withdrawal");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/referrals/metrics"] });
      toast({
        title: "Withdrawal Rejected",
        description: "The withdrawal request has been rejected",
      });
    },
    onError: () => {
      toast({
        title: "Rejection Failed",
        description: "Failed to reject the withdrawal request",
        variant: "destructive",
      });
    },
  });

  const processPayoutMutation = useMutation({
    mutationFn: async (withdrawal: Withdrawal) => {
      const response = await fetch(`/api/withdrawals/${withdrawal.id}/process`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to process payout");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/referrals/metrics"] });
      toast({
        title: "Payout Processed",
        description: "The payout has been processed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Processing Failed",
        description: "Failed to process the payout",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (withdrawal: Withdrawal) => {
    approveMutation.mutate(withdrawal);
  };

  const handleReject = (withdrawal: Withdrawal) => {
    rejectMutation.mutate(withdrawal);
  };

  const handleProcessPayout = (withdrawal: Withdrawal) => {
    processPayoutMutation.mutate(withdrawal);
  };

  const handleNewReferralProgram = () => {
    toast({
      title: "New Referral Program",
      description: "Referral program creation functionality to be implemented",
    });
  };

  if (metricsLoading || withdrawalsLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading referrals data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const referralMetrics: ReferralMetrics = (metrics as ReferralMetrics) || {
    totalReferrers: 0,
    pendingPayouts: 0,
    totalPaid: 0,
    referrerGrowth: "0%",
    pendingCount: 0,
    paidCount: 0,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Referral & Commission Management</h2>
            <p className="text-muted-foreground">Manage referral programs and commission payouts</p>
          </div>
          <Button onClick={handleNewReferralProgram} data-testid="button-new-program">
            <Plus className="w-4 h-4 mr-2" />
            New Referral Program
          </Button>
        </div>

        {/* Commission Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Total Referrers"
            value={referralMetrics.totalReferrers.toString()}
            change={referralMetrics.referrerGrowth}
            trend="up"
            icon={UserCheck}
            iconColor="bg-purple-500/20 text-purple-400"
          />
          <MetricCard
            title="Pending Payouts"
            value={`₹${referralMetrics.pendingPayouts.toLocaleString()}`}
            change={`${referralMetrics.pendingCount} requests`}
            trend="up"
            icon={Clock}
            iconColor="bg-yellow-500/20 text-yellow-400"
          />
          <MetricCard
            title="Total Paid"
            value={`₹${referralMetrics.totalPaid.toLocaleString()}`}
            change={`${referralMetrics.paidCount} payouts`}
            trend="up"
            icon={DollarSign}
            iconColor="bg-green-500/20 text-green-400"
          />
        </div>

        {/* Withdrawal Requests Table */}
        <WithdrawalsTable
          withdrawals={withdrawals}
          onApprove={handleApprove}
          onReject={handleReject}
          onProcessPayout={handleProcessPayout}
        />
      </div>
    </AdminLayout>
  );
}
