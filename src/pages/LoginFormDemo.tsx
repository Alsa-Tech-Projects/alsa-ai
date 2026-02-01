import React from "react";
import LoginForm from "@/components/ui/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LoginFormDemo = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#020202] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black text-white p-6">
      <div className="container max-w-xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="hover:bg-cyan-500/10 text-cyan-400">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>

        <Card className="bg-black/40 border-white/10 backdrop-blur-xl shadow-[0_0_18px_rgba(6,182,212,0.04)] ring-1 ring-cyan-400/6">
          <CardHeader className="text-center">
            <CardTitle className="text-white text-xl tracking-widest">Login Form</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <LoginForm onSubmit={(values) => console.log("Submitted demo form:", values)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginFormDemo;
