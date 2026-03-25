"use client";

import { motion } from "framer-motion";

export function LoadingState({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-16 gap-4"
    >
      <div className="relative w-12 h-12">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/20"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          style={{
            borderTopColor: "hsl(var(--primary))",
          }}
        />
        <div className="absolute inset-2 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-base">⛽</span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground text-center max-w-48">{message}</p>
    </motion.div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3 overflow-hidden">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl shimmer" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 rounded shimmer" />
          <div className="h-3 w-40 rounded shimmer" />
        </div>
        <div className="w-16 h-8 rounded shimmer" />
      </div>
      <div className="space-y-1.5">
        <div className="h-9 rounded-lg shimmer" />
        <div className="h-9 rounded-lg shimmer" />
      </div>
    </div>
  );
}
