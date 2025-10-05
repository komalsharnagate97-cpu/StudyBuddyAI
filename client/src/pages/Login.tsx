import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import LoginForm from "@/components/auth/LoginForm";
import { getSession } from "@/lib/supabase";

export default function Login() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { session } = await getSession();
      if (session) {
        setLocation("/");
      }
      setIsLoading(false);
    };
    
    checkSession();
  }, [setLocation]);

  const handleLoginSuccess = () => {
    setLocation("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <LoginForm onSuccess={handleLoginSuccess} />;
}
