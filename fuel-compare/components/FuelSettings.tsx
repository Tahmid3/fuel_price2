"use client";

import { motion } from "framer-motion";
import { Fuel, Zap, CreditCard, ChevronDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { UserSettings } from "@/types";
import { cn } from "@/lib/utils";

interface FuelSettingsProps {
  settings: UserSettings;
  onChange: (settings: UserSettings) => void;
}

const FUEL_TYPES = [
  { value: "e5", label: "Super E5" },
  { value: "e10", label: "Super E10" },
  { value: "diesel", label: "Diesel" },
] as const;

const COUPON_MULTIPLIERS = [
  { value: "1", label: "Kein Coupon" },
  { value: "3", label: "3× Punkte" },
  { value: "5", label: "5× Punkte" },
  { value: "7", label: "7× Punkte" },
] as const;

export function FuelSettings({ settings, onChange }: FuelSettingsProps) {
  const update = (partial: Partial<UserSettings>) =>
    onChange({ ...settings, ...partial });

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="rounded-2xl border border-border bg-card p-4 space-y-5"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Fuel className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm font-semibold text-foreground">Einstellungen</span>
      </div>

      {/* Fuel type + liters row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">
            Kraftstoff
          </Label>
          <Select
            value={settings.fuelType}
            onValueChange={(v) => update({ fuelType: v as UserSettings["fuelType"] })}
          >
            <SelectTrigger className="h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FUEL_TYPES.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">
            Liter: <span className="text-foreground font-bold">{settings.liters}L</span>
          </Label>
          <div className="flex items-center h-10 gap-3">
            <Slider
              min={10}
              max={100}
              step={5}
              value={[settings.liters]}
              onValueChange={([v]) => update({ liters: v })}
              className="flex-1"
            />
          </div>
        </div>
      </div>

      {/* Payback coupon */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground uppercase tracking-wide">
          Payback Coupon
        </Label>
        <div className="grid grid-cols-4 gap-1.5">
          {COUPON_MULTIPLIERS.map((c) => (
            <button
              key={c.value}
              onClick={() =>
                update({ couponMultiplier: parseInt(c.value) as UserSettings["couponMultiplier"] })
              }
              className={cn(
                "h-9 rounded-lg text-xs font-semibold border transition-all duration-150",
                settings.couponMultiplier === parseInt(c.value)
                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                  : "bg-secondary text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              )}
            >
              {c.value === "1" ? "Kein" : c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toggles row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Payback Turbo */}
        <div
          className={cn(
            "flex items-center justify-between rounded-xl border p-3 transition-all duration-200 cursor-pointer",
            settings.turboEnabled
              ? "border-yellow-500/40 bg-yellow-500/5"
              : "border-border bg-secondary/30"
          )}
          onClick={() => update({ turboEnabled: !settings.turboEnabled })}
        >
          <div className="flex items-center gap-2">
            <Zap
              className={cn(
                "h-4 w-4 transition-colors",
                settings.turboEnabled ? "text-yellow-400" : "text-muted-foreground"
              )}
            />
            <span className="text-xs font-medium">Turbo</span>
          </div>
          <Switch
            checked={settings.turboEnabled}
            onCheckedChange={(v) => update({ turboEnabled: v })}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Circle K */}
        <div
          className={cn(
            "flex items-center justify-between rounded-xl border p-3 transition-all duration-200 cursor-pointer",
            settings.circleKEnabled
              ? "border-red-500/40 bg-red-500/5"
              : "border-border bg-secondary/30"
          )}
          onClick={() => update({ circleKEnabled: !settings.circleKEnabled })}
        >
          <div className="flex items-center gap-2">
            <CreditCard
              className={cn(
                "h-4 w-4 transition-colors",
                settings.circleKEnabled ? "text-red-400" : "text-muted-foreground"
              )}
            />
            <span className="text-xs font-medium">Circle K</span>
          </div>
          <Switch
            checked={settings.circleKEnabled}
            onCheckedChange={(v) => update({ circleKEnabled: v })}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>

      {/* Point value (optional) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">
            Punktwert
          </Label>
          <span className="text-xs font-mono text-foreground">
            {settings.pointValueCents}ct / Punkt
          </span>
        </div>
        <Slider
          min={0.5}
          max={2}
          step={0.1}
          value={[settings.pointValueCents]}
          onValueChange={([v]) => update({ pointValueCents: Math.round(v * 10) / 10 })}
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>0.5ct</span>
          <span className="text-primary">Standard: 1ct</span>
          <span>2ct</span>
        </div>
      </div>
    </motion.div>
  );
}
