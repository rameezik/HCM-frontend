"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  Users,
  Building2,
  BriefcaseBusiness,
  UserCog,
  Wallet,
  ScrollText,
  Settings,
  CalendarCheck,
  CalendarDays,
  UserRound,
  Clock3,
  ReceiptText,
  ChevronRight,
  Sparkles,
  Camera,
  KeyRound,
  BarChart3,
} from "lucide-react";

import { navigation } from "@/config/navigation";

const iconMap = {
  LayoutDashboard,
  Users,
  Building2,
  BriefcaseBusiness,
  UserCog,
  Wallet,
  ScrollText,
  Settings,
  CalendarCheck,
  CalendarDays,
  UserRound,
  Clock3,
  ReceiptText,
  Camera,
  BarChart3,
};

export default function Sidebar({ role = "admin" }) {
  const pathname = usePathname();

  const menuItems = navigation[role] || [];

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-r border-white/10 bg-[#0A0A0A] md:w-64">
      {/* Brand */}
      <div className="shrink-0 border-b border-white/10 px-6 py-7">
        <Link href={`/${role}/dashboard`} className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#007BA7] to-[#FF2D95]">
            <Sparkles size={22} className="text-white" />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              HCM <span className="text-[#FF2D95]">Lite</span>
            </h1>

            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">
              Human Capital
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-6">
        <p className="mb-4 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
          {role} workspace
        </p>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = iconMap[item.icon] || LayoutDashboard;

            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`group flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? "border border-[#007BA7]/30 bg-[#007BA7]/10 text-white"
                    : "border border-transparent text-white/50 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={19}
                    strokeWidth={1.8}
                    className={
                      isActive
                        ? "text-[#007BA7]"
                        : "text-white/40 group-hover:text-[#FF2D95]"
                    }
                  />

                  <span>{item.label}</span>
                </div>

                {isActive && (
                  <ChevronRight size={15} className="text-[#007BA7]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <nav
        aria-label="Account settings"
        className="shrink-0 border-t border-white/10 p-3"
      >
        <Link
          href={`/${role}/password`}
          aria-current={pathname === `/${role}/password` ? "page" : undefined}
          className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-sm font-medium ${pathname === `/${role}/password` ? "border-[#007BA7]/30 bg-[#007BA7]/10 text-white" : "border-transparent text-white/60 hover:bg-white/5 hover:text-white"}`}
        >
          <KeyRound size={19} aria-hidden="true" />
          Change password
        </Link>
      </nav>
    </aside>
  );
}
