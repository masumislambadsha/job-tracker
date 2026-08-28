"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Briefcase, Sparkles, LogIn, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("badsha@jobdesk.app");
  const [password, setPassword] = useState("password123");
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError("");

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to log in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    try {
      setIsDemoLoading(true);
      setError("");

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDemo: true }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Demo login failed");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to log in with demo account");
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Briefcase className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">JobDesk</h1>
          <p className="text-xs text-muted-foreground">Personal Job Application Pipeline & Analytics</p>
        </div>

        {/* Login Card */}
        <Card className="p-6 sm:p-8 space-y-5 border">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-base text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Sign in to manage your applications and follow-ups
            </CardDescription>
          </CardHeader>

          {error && (
            <div className="rounded-xl bg-destructive/15 border border-destructive/30 p-3 text-xs text-destructive">
              {error}
            </div>
          )}

          {/* 1-Click Demo Login */}
          <Button
            type="button"
            className="w-full h-11 text-sm font-semibold justify-center gap-2"
            disabled={isDemoLoading}
            onClick={handleDemoLogin}
          >
            <Sparkles className="h-4 w-4" />
            <span>{isDemoLoading ? "Signing in..." : "1-Click Demo Sign In"}</span>
          </Button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-border w-full" />
            <span className="bg-background px-3 text-[11px] uppercase tracking-wider text-muted-foreground absolute">
              or credentials
            </span>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              variant="secondary"
              className="w-full h-10 font-medium justify-center"
              disabled={isLoading}
            >
              <LogIn className="h-4 w-4" />
              <span>{isLoading ? "Signing in..." : "Sign In with Email"}</span>
            </Button>
          </form>

          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              Don&apos;t have an account yet?{" "}
              <Link href="/register" className="font-semibold text-primary hover:underline">
                Create Account →
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}