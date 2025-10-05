import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle, XCircle } from "lucide-react";
import { Withdrawal } from "@shared/schema";

interface WithdrawalsTableProps {
  withdrawals: (Withdrawal & { userName: string; userEmail: string })[];
  onApprove: (withdrawal: Withdrawal) => void;
  onReject: (withdrawal: Withdrawal) => void;
  onProcessPayout: (withdrawal: Withdrawal) => void;
}

export default function WithdrawalsTable({ 
  withdrawals, 
  onApprove, 
  onReject, 
  onProcessPayout 
}: WithdrawalsTableProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pending", color: "bg-yellow-500/20 text-yellow-400" },
      approved: { label: "Approved", color: "bg-green-500/20 text-green-400" },
      rejected: { label: "Rejected", color: "bg-red-500/20 text-red-400" },
      processed: { label: "Processed", color: "bg-blue-500/20 text-blue-400" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Withdrawal Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referrer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawals.map((withdrawal) => (
                <TableRow key={withdrawal.id} className="hover:bg-accent/50">
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>
                          {withdrawal.userName.split(" ").map(n => n[0]).join("").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground" data-testid={`withdrawal-name-${withdrawal.id}`}>
                          {withdrawal.userName}
                        </p>
                        <p className="text-xs text-muted-foreground" data-testid={`withdrawal-email-${withdrawal.id}`}>
                          {withdrawal.userEmail}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium text-foreground" data-testid={`withdrawal-amount-${withdrawal.id}`}>
                      ₹{Number(withdrawal.amount).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground" data-testid={`withdrawal-method-${withdrawal.id}`}>
                      {withdrawal.method}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground" data-testid={`withdrawal-date-${withdrawal.id}`}>
                      {formatDate(withdrawal.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(withdrawal.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {withdrawal.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => onApprove(withdrawal)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            data-testid={`button-approve-${withdrawal.id}`}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onReject(withdrawal)}
                            data-testid={`button-reject-${withdrawal.id}`}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      {withdrawal.status === "approved" && (
                        <Button
                          size="sm"
                          onClick={() => onProcessPayout(withdrawal)}
                          data-testid={`button-process-${withdrawal.id}`}
                        >
                          Process Payout
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
