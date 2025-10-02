"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import LoginForm from "~/components/LoginForm";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (session) {
    redirect("/workspace");
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-12">
        <h1 className="text-4xl font-bold text-center mb-8">
          Welcome to Cognito Auth
        </h1>
        <LoginForm />
      </div>
    </div>
  );
}
