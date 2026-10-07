import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "gold";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  children,
  icon,
  className = "",
  ...props
}: ButtonProps) {
  const baseClasses =
    "rounded-full font-bold inline-flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const sizeClasses = {
    sm: "text-xs px-3.5 py-1.5",
    md: "text-xs md:text-sm px-5 py-2.5",
    lg: "text-sm md:text-base px-7 py-3.5",
  };

  const variantClasses = {
    primary:
      "bg-[#0B57D0] text-white hover:bg-[#0842A0] shadow-sm shadow-[#0B57D0]/25 active:scale-98",
    secondary:
      "bg-[#E8F1FD] text-[#0B57D0] hover:bg-[#C7DEFB] active:scale-98",
    outline:
      "bg-transparent border-1.5 border-[#0B57D0] text-[#0B57D0] hover:bg-[#E8F1FD] active:scale-98",
    ghost:
      "bg-transparent text-[#5A6478] hover:text-[#0E1B3D] hover:bg-[#F5F7FF]",
    gold:
      "bg-[#F59E0B] text-[#0E1B3D] hover:bg-[#D97706] shadow-sm shadow-[#F59E0B]/30 font-extrabold active:scale-98",
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}
