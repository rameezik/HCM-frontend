"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function DashboardLayout({ role, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#0A0A0A] text-white">
      {/* Desktop Sidebar */}
      <div className="hidden w-64 shrink-0 md:block">
        <div className="sticky top-0 h-screen overflow-hidden">
          <Sidebar role={role} />
        </div>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
            className="absolute inset-0 bg-black/70"
          />

          <div className="relative h-full w-64 overflow-y-auto bg-[#0A0A0A]">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setSidebarOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-lg p-2 text-white"
            >
              <X size={20} />
            </button>

            <div onClick={() => setSidebarOpen(false)}>
              <Sidebar role={role} />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Navbar */}
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0A0A0A]/95 backdrop-blur-xl">
          <div className="flex items-center gap-3 px-5 py-3 md:px-8">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-white md:hidden"
            >
              <Menu size={22} />
            </button>

            <div className="min-w-0 flex-1">
              <Navbar role={role} />
            </div>
          </div>
        </header>

        {/* Dashboard Page */}
        <main className="w-full flex-1 px-5 py-8 md:px-8 lg:px-10">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
