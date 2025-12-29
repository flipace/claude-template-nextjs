"use client";

import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  colorClass?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  colorClass = "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
}: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${colorClass.split(" ").slice(0, 2).join(" ")}`}>
        <Icon className={`w-8 h-8 ${colorClass.split(" ").slice(2).join(" ")}`} />
      </div>
      <p className="text-foreground font-medium">{title}</p>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  );
}
