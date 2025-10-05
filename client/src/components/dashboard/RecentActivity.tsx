import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ActivityItem {
  id: string;
  type: "registration" | "payment" | "withdrawal";
  description: string;
  timestamp: string;
  icon: string;
  iconBg: string;
  status: string;
  statusColor: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-4 p-4 bg-accent/50 rounded-lg">
              <div className={`w-10 h-10 ${activity.iconBg} rounded-full flex items-center justify-center`}>
                <i className={`${activity.icon} text-sm`}></i>
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground" data-testid={`activity-description-${activity.id}`}>
                  {activity.description}
                </p>
                <p className="text-xs text-muted-foreground" data-testid={`activity-timestamp-${activity.id}`}>
                  {activity.timestamp}
                </p>
              </div>
              <Badge className={activity.statusColor} data-testid={`activity-status-${activity.id}`}>
                {activity.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
