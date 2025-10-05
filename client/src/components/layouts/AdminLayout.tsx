import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { supabase, signOut } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  LayoutDashboard, 
  Users, 
  Handshake, 
  Package, 
  HelpCircle, 
  Bell, 
  UserCheck,
  Search,
  LogOut
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, section: "dashboard" },
  { name: "Clients & Leads", href: "/clients", icon: Users, section: "clients" },
  { name: "Referrals & Commission", href: "/referrals", icon: Handshake, section: "referrals" },
  { name: "Products & Campaigns", href: "/products", icon: Package, section: "products" },
  { name: "FAQ Management", href: "/faq", icon: HelpCircle, section: "faq" },
  { name: "Notifications", href: "/notifications", icon: Bell, section: "notifications" },
  { name: "Team Management", href: "/team", icon: UserCheck, section: "team" },
];

const sectionTitles = {
  dashboard: { title: "Dashboard Overview", subtitle: "Monitor your business performance and key metrics" },
  clients: { title: "Client & Lead Management", subtitle: "Manage your clients, leads, and follow-up activities" },
  referrals: { title: "Referral & Commission Management", subtitle: "Manage referral programs and commission payouts" },
  products: { title: "Product & Campaign Management", subtitle: "Manage your products, AI assistants, and marketing campaigns" },
  faq: { title: "FAQ Management", subtitle: "Organize and manage frequently asked questions by category" },
  notifications: { title: "Notification Broadcasting", subtitle: "Send notifications to users with emoji support and scheduling" },
  team: { title: "Team Management", subtitle: "Manage team members, roles, and access permissions" },
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const [adminUser, setAdminUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        setAdminUser(user);
      }
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/login";
  };

  const getCurrentSection = () => {
    if (location === "/") return "dashboard";
    return location.slice(1).split("/")[0];
  };

  const currentSection = getCurrentSection();
  const sectionInfo = sectionTitles[currentSection as keyof typeof sectionTitles] || sectionTitles.dashboard;

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border z-40">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Digital Dynamic</h2>
                <p className="text-xs text-muted-foreground">Admin Panel</p>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = (item.href === "/" && location === "/") || 
                               (item.href !== "/" && location.startsWith(item.href));
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                  data-testid={`nav-${item.section}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
          
          <div className="p-4 border-t border-border">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-xs text-primary-foreground font-medium">
                {adminUser?.email?.[0]?.toUpperCase() || "A"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground" data-testid="admin-name">
                  {adminUser?.user_metadata?.name || "Admin User"}
                </p>
                <p className="text-xs text-muted-foreground truncate" data-testid="admin-email">
                  {adminUser?.email || "admin@company.com"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground" data-testid="page-title">
                {sectionInfo.title}
              </h1>
              <p className="text-muted-foreground" data-testid="page-subtitle">
                {sectionInfo.subtitle}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-10 w-64"
                  data-testid="input-search"
                />
              </div>
              <Button variant="ghost" size="sm" className="relative" data-testid="button-notifications">
                <Bell className="w-4 h-4" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-destructive rounded-full"></span>
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
