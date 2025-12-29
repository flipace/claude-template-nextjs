"use client";

import { motion } from "framer-motion";
import type { ListWithItems } from "../hooks/useLists";

interface ListCardProps {
  list: ListWithItems;
  onClick: () => void;
}

export function ListCard({ list, onClick }: ListCardProps) {
  const checkedCount = list.items.filter((i) => i.isChecked).length;
  const totalCount = list.items.length;

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="w-full bg-card border rounded-xl p-4 text-left hover:border-primary/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{list.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{list.name}</p>
          <p className="text-sm text-muted-foreground">
            {totalCount === 0
              ? "Keine Einträge"
              : `${checkedCount}/${totalCount} erledigt`}
          </p>
        </div>
        {totalCount > 0 && (
          <div className="w-12 h-12 rounded-full border-4 border-secondary flex items-center justify-center relative">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-primary"
                strokeDasharray={`${(checkedCount / totalCount) * 94.2} 94.2`}
              />
            </svg>
            <span className="text-xs font-medium">
              {Math.round((checkedCount / totalCount) * 100)}%
            </span>
          </div>
        )}
      </div>
    </motion.button>
  );
}
