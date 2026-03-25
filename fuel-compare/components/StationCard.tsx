"use client";

import { motion } from "framer-motion";
import { MapPin, Navigation, Trophy, TrendingDown, CreditCard, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProcessedStation } from "@/types";
import { getBrandColor } from "@/utils/fuelCalculator";
import { cn } from "@/lib/utils";

interface StationCardProps {
  station: ProcessedStation;
  index: number;
  showPayback: boolean;
  showCircleK: boolean;
}

function PriceRow({
  label,
  price,
  isBest,
  icon,
  color,
  savings,
}: {
  label: string;
  price: number | null;
  isBest: boolean;
  icon: React.ReactNode;
  color: string;
  savings?: number;
}) {
  if (price === null) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg px-3 py-2 transition-all",
        isBest ? "bg-green-500/10 border border-green-500/20" : "bg-secondary/40"
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn("text-sm", color)}>{icon}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
        {savings && savings > 0 && (
          <span className="text-[10px] font-semibold text-green-400">
            −{savings.toFixed(1)}ct
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "text-base font-bold font-mono tabular-nums",
            isBest ? "text-green-400" : "text-foreground"
          )}
        >
          {price.toFixed(3)}
        </span>
        <span className="text-xs text-muted-foreground">€/L</span>
        {isBest && (
          <Trophy className="h-3 w-3 text-green-400 ml-0.5" />
        )}
      </div>
    </div>
  );
}

function BrandLogo({ brand, color }: { brand: string; color: string }) {
  const initials = brand.substring(0, 2).toUpperCase();
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0"
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}

export function StationCard({
  station,
  index,
  showPayback,
  showCircleK,
}: StationCardProps) {
  const brandColor = getBrandColor(station.brand);
  const savings =
    station.bestPrice < station.listedPrice
      ? (station.listedPrice - station.bestPrice) * 100
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
      className={cn(
        "rounded-2xl border p-4 space-y-3 transition-all duration-300",
        station.isOverallCheapest
          ? "border-green-500/40 bg-gradient-to-br from-green-500/5 to-card winner-glow"
          : "border-border bg-card hover:border-border/60"
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <BrandLogo brand={station.displayBrand} color={brandColor} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm text-foreground">{station.displayBrand}</span>
            {station.isOverallCheapest && (
              <Badge variant="success" className="text-[10px] py-0 px-1.5 h-5">
                🏆 Günstigste
              </Badge>
            )}
            {!station.isOpen && (
              <Badge variant="destructive" className="text-[10px] py-0 px-1.5 h-5">
                Geschlossen
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{station.address}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Navigation className="h-3 w-3" />
              {station.distance < 1
                ? `${Math.round(station.distance * 1000)}m`
                : `${station.distance.toFixed(1)}km`}
            </span>
            {savings > 0.05 && (
              <span className="flex items-center gap-1 text-[11px] text-green-400 font-medium">
                <TrendingDown className="h-3 w-3" />
                {savings.toFixed(1)}ct gespart/L
              </span>
            )}
          </div>
        </div>
        {/* Listed price large */}
        <div className="text-right shrink-0">
          <div className="text-xl font-black font-mono tabular-nums text-foreground">
            {station.listedPrice.toFixed(3)}
          </div>
          <div className="text-[10px] text-muted-foreground -mt-0.5">€/L Listenpreis</div>
        </div>
      </div>

      {/* Prices */}
      {(showPayback || showCircleK) && (
        <div className="space-y-1.5">
          {showPayback && station.paybackEffectivePrice !== null && (
            <PriceRow
              label="Mit Payback"
              price={station.paybackEffectivePrice}
              isBest={station.bestOption === "payback"}
              icon={<Star className="h-3.5 w-3.5 inline" />}
              color="text-yellow-400"
              savings={(station.listedPrice - station.paybackEffectivePrice) * 100}
            />
          )}
          {showCircleK && station.circleKEffectivePrice !== null && (
            <PriceRow
              label="Mit Circle K"
              price={station.circleKEffectivePrice}
              isBest={station.bestOption === "circlek"}
              icon={<CreditCard className="h-3.5 w-3.5 inline" />}
              color="text-red-400"
              savings={(station.listedPrice - station.circleKEffectivePrice) * 100}
            />
          )}
        </div>
      )}

      {/* Break-even hint */}
      {station.breakEvenDelta !== null && station.breakEvenDelta > 0 && (
        <div className="rounded-lg bg-primary/5 border border-primary/15 px-3 py-2">
          <p className="text-[11px] text-muted-foreground">
            💡 Aral kann bis zu{" "}
            <span className="text-primary font-bold">
              {station.breakEvenDelta.toFixed(1)}ct/L
            </span>{" "}
            teurer sein und ist mit Payback trotzdem günstiger.
          </p>
        </div>
      )}
    </motion.div>
  );
}
