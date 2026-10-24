"use client";

import { motion } from "motion/react";
import {
  Users,
  Wallet,
  Building2,
  Activity,
  ArrowUpRight,
  BrainCircuit,
  CalendarDays,
  Clock3,
  UserCheck,
  TrendingUp,
  ClipboardList,
} from "lucide-react";

const iconMap = {
  users: Users,
  wallet: Wallet,
  building: Building2,
  activity: Activity,
  arrow: ArrowUpRight,
  ai: BrainCircuit,
  calendar: CalendarDays,
  clock: Clock3,
  userCheck: UserCheck,
  trending: TrendingUp,
  clipboard: ClipboardList,
};

export default function StatCard({
  title,
  value = "—",
  icon = "users",
  description,
}) {
  const Icon = iconMap[icon] || Users;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#111111] p-6"
    >
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#007BA7]/10 blur-3xl transition-all group-hover:bg-[#FF2D95]/10" />

      <div className="relative flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#007BA7]/20 bg-[#007BA7]/10 text-[#007BA7]">
          <Icon size={23} strokeWidth={1.8} />
        </div>

        <ArrowUpRight
          size={18}
          className="text-white/30 transition-colors group-hover:text-[#FF2D95]"
        />
      </div>

      <div className="relative mt-6">
        <p className="text-sm font-medium text-white/50">{title}</p>

        <h3 className="mt-2 text-3xl font-semibold tracking-tight text-white">
          {value}
        </h3>

        {description && (
          <p className="mt-2 text-xs text-white/40">{description}</p>
        )}
      </div>
    </motion.div>
  );
}