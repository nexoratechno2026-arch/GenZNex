"use client";

import React from "react";
import { Sidebar } from "@/components/navigation/Sidebar";
import { Navbar } from "@/components/navigation/Navbar";
import { useAuth } from "@/lib/context/AuthContext";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { role } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black text-black dark:text-white">
      <Navbar currentRole={role} isEmulatorActive={true} />
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        <Sidebar role="student" />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
