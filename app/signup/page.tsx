"use client";

import { useState } from "react";
import Link from "next/link";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const cleanUsername = username.trim().toLowerCase();

    if (cleanUsername.length < 3) {
      setMessage("Username must contain at least 3 characters.");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must contain at least 6 characters.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          username: cleanUsername,
        },
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage(
      "Account created! Check your email and verify your account before signing in."
    );

    setUsername("");
    setEmail("");
    setPassword("");
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <form
        onSubmit={handleSignup}
        className="w-full max-w-md space-y-6 rounded-2xl border border-gray-800 bg-zinc-900 p-8"
      >
        <div className="text-center">
          <h1 className="text-4xl font-bold">Pulse</h1>

          <p className="mt-2 text-gray-400">
            Create your account
          </p>
        </div>

        <Input
          label="Username"
          name="username"
          placeholder="Choose a username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button type="submit">
          {loading ? "Creating Account..." : "Create Account"}
        </Button>

        {message && (
          <p className="text-center text-sm text-gray-300">
            {message}
          </p>
        )}

        <p className="text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-white hover:underline"
          >
            Sign In
          </Link>
        </p>
      </form>
    </main>
  );
}