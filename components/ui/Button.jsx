"use client";

import { motion } from "motion/react";

export default function Button({
  children,
  type = "button",
  onClick,
  disabled = false,
  className = "",
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={`
        gradient-bg inline-flex items-center justify-center gap-2
        rounded-xl px-5 py-3 font-semibold text-white
        shadow-[0_8px_30px_rgba(0,123,167,0.12)]
        transition-shadow hover:shadow-[0_8px_35px_rgba(255,45,149,0.2)]
        focus-visible:outline-2 focus-visible:outline-offset-2
        focus-visible:outline-[#ff2d95]
        disabled:cursor-not-allowed disabled:opacity-50
        ${className}
      `}
    >
      {children}
    </motion.button>
  );
}