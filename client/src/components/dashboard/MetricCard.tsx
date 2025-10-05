import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: LucideIcon;
  iconColor: string;
}

export default function MetricCard({ 
  title, 
  value, 
  change, 
  trend, 
  icon: Icon, 
  iconColor 
}: MetricCardProps) {
  return (
    <Card className="metric-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground" data-testid={`metric-title-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              {title}
            </p>
            <p className="text-3xl font-bold text-foreground" data-testid={`metric-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              {value}
            </p>
            <p className={`text-sm mt-1 ${trend === "up" ? "text-green-400" : "text-yellow-400"}`}>
              <i className={`fas fa-arrow-${trend} mr-1`}></i>
              <span data-testid={`metric-change-${title.toLowerCase().replace(/\s+/g, '-')}`}>{change}</span>
            </p>
          </div>
          <div className={`w-12 h-12 ${iconColor} rounded-lg flex items-center justify-center`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
