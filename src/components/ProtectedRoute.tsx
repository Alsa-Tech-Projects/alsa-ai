import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/"); // Agar login nahi hai toh home page (Index) par bhej do
      } else {
        setLoading(false);
      }
    };
    checkUser();
  }, [navigate]);

  if (loading) return null; // Ya loading spinner dikha sakte hain

  return <>{children}</>;
};

export default ProtectedRoute;