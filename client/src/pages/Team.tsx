import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/layouts/AdminLayout";
import TeamTable from "@/components/team/TeamTable";
import { useToast } from "@/hooks/use-toast";
import { TeamMember } from "@shared/schema";

export default function Team() {
  const { toast } = useToast();

  const { data: teamMembers = [], isLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/team/members"],
  });

  const { data: teamStats } = useQuery<any>({
    queryKey: ["/api/team/stats"],
  });

  const handleInviteMember = () => {
    toast({
      title: "Invite Team Member",
      description: "Team member invitation functionality to be implemented",
    });
  };

  const handleEditMember = (member: TeamMember) => {
    toast({
      title: "Edit Team Member",
      description: `Edit functionality for ${member.name} to be implemented`,
    });
  };

  const handleAssignLeads = (member: TeamMember) => {
    toast({
      title: "Assign Leads",
      description: `Lead assignment for ${member.name} to be implemented`,
    });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading team data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const defaultStats = {
    totalMembers: (teamMembers as TeamMember[]).length,
    admins: (teamMembers as TeamMember[]).filter((m: TeamMember) => m.role === "admin").length,
    managers: (teamMembers as TeamMember[]).filter((m: TeamMember) => m.role === "manager").length,
    activeToday: (teamMembers as TeamMember[]).filter((m: TeamMember) => {
      if (!m.lastActive) return false;
      const today = new Date();
      const lastActive = new Date(m.lastActive);
      return today.getDate() === lastActive.getDate();
    }).length,
  };

  return (
    <AdminLayout>
      <TeamTable
        teamMembers={teamMembers as TeamMember[]}
        teamStats={(teamStats as any) || defaultStats}
        onInviteMember={handleInviteMember}
        onEditMember={handleEditMember}
        onAssignLeads={handleAssignLeads}
      />
    </AdminLayout>
  );
}
