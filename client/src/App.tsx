import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { getSession, onAuthStateChange } from "@/lib/supabase";

// Pages
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Clients from "@/pages/Clients";
import Referrals from "@/pages/Referrals";
import Products from "@/pages/Products";
import FAQ from "@/pages/FAQ";
import Notifications from "@/pages/Notifications";
import Team from "@/pages/Team";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { session } = await getSession();
      setIsAuthenticated(!!session);
    };

    checkAuth();

    const { data: { subscription } } = onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/clients">
        <ProtectedRoute>
          <Clients />
        </ProtectedRoute>
      </Route>
      
      <Route path="/referrals">
        <ProtectedRoute>
          <Referrals />
        </ProtectedRoute>
      </Route>
      
      <Route path="/products">
        <ProtectedRoute>
          <Products />
        </ProtectedRoute>
      </Route>
      
      <Route path="/faq">
        <ProtectedRoute>
          <FAQ />
        </ProtectedRoute>
      </Route>
      
      <Route path="/notifications">
        <ProtectedRoute>
          <Notifications />
        </ProtectedRoute>
      </Route>
      
      <Route path="/team">
        <ProtectedRoute>
          <Team />
        </ProtectedRoute>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
