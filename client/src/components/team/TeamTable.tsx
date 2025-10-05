import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Plus, Search, Edit, UserPlus, MoreVertical, Users, Shield, UserCheck, Tag } from "lucide-react";
import { TeamMember } from "@shared/schema";
import MetricCard from "../dashboard/MetricCard";

interface TeamStats {
  totalMembers: number;
  admins: number;
  managers: number;
  activeToday: number;
}

interface TeamTableProps {
  teamMembers: TeamMember[];
  teamStats: TeamStats;
  onInviteMember: () => void;
  onEditMember: (member: TeamMember) => void;
  onAssignLeads: (member: TeamMember) => void;
}

export default function TeamTable({ 
  teamMembers, 
  teamStats, 
  onInviteMember, 
  onEditMember, 
  onAssignLeads 
}: TeamTableProps) {
  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: "Admin", color: "bg-red-500/20 text-red-400" },
      manager: { label: "Manager", color: "bg-yellow-500/20 text-yellow-400" },
      agent: { label: "Agent", color: "bg-blue-500/20 text-blue-400" },
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.agent;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getStatusIndicator = (lastActive: Date | null) => {
    if (!lastActive) return { color: "bg-gray-400", label: "Never" };
    
    const now = new Date();
    const diffHours = (now.getTime() - new Date(lastActive).getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) return { color: "bg-green-400", label: "Online" };
    if (diffHours < 24) return { color: "bg-yellow-400", label: `${Math.floor(diffHours)}h ago` };
    return { color: "bg-gray-400", label: `${Math.floor(diffHours / 24)}d ago` };
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
          <h2 className="text-xl font-semibold text-foreground">Team Management</h2>
          <p className="text-muted-foreground">Manage team members, roles, and access permissions</p>
        </div>
        <Button onClick={onInviteMember} data-testid="button-invite-member">
          <Plus className="w-4 h-4 mr-2" />
          Invite Team Member
        </Button>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Total Members"
          value={teamStats.totalMembers.toString()}
          change="+5.2%"
          trend="up"
          icon={Users}
          iconColor="bg-blue-500/20 text-blue-400"
        />
        <MetricCard
          title="Admins"
          value={teamStats.admins.toString()}
          change="No change"
          trend="up"
          icon={Shield}
          iconColor="bg-red-500/20 text-red-400"
        />
        <MetricCard
          title="Managers"
          value={teamStats.managers.toString()}
          change="+1"
          trend="up"
          icon={Tag}
          iconColor="bg-yellow-500/20 text-yellow-400"
        />
        <MetricCard
          title="Active Today"
          value={teamStats.activeToday.toString()}
          change="66%"
          trend="up"
          icon={UserCheck}
          iconColor="bg-green-500/20 text-green-400"
        />
      </div>

      {/* Team Members Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Team Members</CardTitle>
            <div className="flex items-center space-x-3">
              <Select>
                <SelectTrigger className="w-32" data-testid="select-role-filter">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  className="pl-10 w-64"
                  data-testid="input-search-members"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Assigned Leads</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member) => {
                  const status = getStatusIndicator(member.lastActive);
                  
                  return (
                    <TableRow key={member.id} className="hover:bg-accent/50">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback>
                              {member.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-foreground" data-testid={`member-name-${member.id}`}>
                              {member.name}
                            </p>
                            <p className="text-xs text-muted-foreground" data-testid={`member-email-${member.id}`}>
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(member.role)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 ${status.color} rounded-full`}></div>
                          <span className="text-sm text-muted-foreground" data-testid={`member-status-${member.id}`}>
                            {status.label}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground" data-testid={`member-leads-${member.id}`}>
                          {member.assignedLeads || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress 
                            value={Number(member.performance) || 0} 
                            className="w-16 h-2" 
                          />
                          <span className="text-xs text-muted-foreground" data-testid={`member-performance-${member.id}`}>
                            {Number(member.performance) || 0}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditMember(member)}
                            className="text-blue-400 hover:bg-blue-500/20"
                            data-testid={`button-edit-member-${member.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onAssignLeads(member)}
                            className="text-yellow-400 hover:bg-yellow-500/20"
                            data-testid={`button-assign-leads-${member.id}`}
                          >
                            <UserPlus className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground hover:bg-accent"
                            data-testid={`button-more-member-${member.id}`}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
