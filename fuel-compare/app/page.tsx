"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, RefreshCw, AlertCircle, Gauge } from "lucide-react";
import { FuelSettings } from "@/components/FuelSettings";
import { StationCard } from "@/components/StationCard";
import { LoadingState, SkeletonCard } from "@/components/LoadingState";
import { Button } from "@/components/ui/button";
import { UserSettings, ProcessedStation, Location, TankerkoenigStation } from "@/types";
import {
  calculatePaybackPrice,
  calculateCircleKPrice,
  findBestOption,
  calculateBreakEven,
  getBrandDisplayName,
  normalizeBrand,
} from "@/utils/fuelCalculator";

const DEFAULT_SETTINGS: UserSettings = {
  fuelType: "e5",
  liters: 50,
  couponMultiplier: 3,
  turboEnabled: false,
  circleKEnabled: false,
  pointValueCents: 1,
  radius: 5,
};

function processStations(
  stations: TankerkoenigStation[],
  settings: UserSettings,
  allStations: TankerkoenigStation[]
): ProcessedStation[] {
  if (!stations.length) return [];

  const processed: ProcessedStation[] = stations
    .filter((s) => {
      const price = s[settings.fuelType];
      return price && typeof price === "number" && price > 0;
    })
    .map((station) => {
      const listedPrice = station[settings.fuelType] as number;
      const brand = station.brand || "";
      const brandKey = normalizeBrand(brand);

      // Payback only applies to Aral
      let paybackEffectivePrice: number | null = null;
      if (brandKey.includes("aral") && settings.couponMultiplier > 1 || brandKey.includes("aral") && settings.turboEnabled) {
        const result = calculatePaybackPrice({
          liters: settings.liters,
          pricePerLiter: listedPrice,
          couponMultiplier: settings.couponMultiplier,
          turboEnabled: settings.turboEnabled,
          pointValueCents: settings.pointValueCents,
        });
        paybackEffectivePrice = result.effectivePrice;
      } else if (brandKey.includes("aral")) {
        // Always show payback for Aral if coupon is selected or turbo
        const result = calculatePaybackPrice({
          liters: settings.liters,
          pricePerLiter: listedPrice,
          couponMultiplier: settings.couponMultiplier,
          turboEnabled: settings.turboEnabled,
          pointValueCents: settings.pointValueCents,
        });
        paybackEffectivePrice = result.effectivePrice;
      }

      // Circle K applies if enabled
      let circleKEffectivePrice: number | null = null;
      if (settings.circleKEnabled) {
        circleKEffectivePrice = calculateCircleKPrice({
          pricePerLiter: listedPrice,
          brand,
        });
      }

      const { bestPrice, bestOption } = findBestOption(
        listedPrice,
        paybackEffectivePrice,
        circleKEffectivePrice
      );

      // Break-even delta: compare with cheapest non-Aral station
      let breakEvenDelta: number | null = null;
      if (!brandKey.includes("aral")) {
        // Find best Aral price
        const aralStation = allStations.find((s) => normalizeBrand(s.brand).includes("aral"));
        if (aralStation) {
          const aralPrice = aralStation[settings.fuelType] as number;
          if (aralPrice) {
            const delta = calculateBreakEven(
              listedPrice,
              aralPrice,
              settings.liters,
              settings.couponMultiplier,
              settings.turboEnabled,
              settings.pointValueCents
            );
            breakEvenDelta = delta > 0 ? delta : null;
          }
        }
      }

      const address = [
        station.street,
        station.houseNumber,
        station.place,
      ]
        .filter(Boolean)
        .join(" ");

      return {
        id: station.id,
        brand,
        displayBrand: getBrandDisplayName(brand),
        name: station.name,
        address,
        distance: station.dist,
        listedPrice,
        paybackEffectivePrice,
        circleKEffectivePrice,
        bestPrice,
        bestOption,
        isOverallCheapest: false, // set below
        breakEvenDelta,
        isOpen: station.isOpen,
        lat: station.lat,
        lng: station.lng,
      };
    });

  // Find overall cheapest
  if (processed.length > 0) {
    const minPrice = Math.min(...processed.map((s) => s.bestPrice));
    processed.forEach((s) => {
      s.isOverallCheapest = Math.abs(s.bestPrice - minPrice) < 0.0001;
    });
  }

  // Sort by best price
  return processed.sort((a, b) => a.bestPrice - b.bestPrice);
}

export default function Home() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [location, setLocation] = useState<Location | null>(null);
  const [stations, setStations] = useState<TankerkoenigStation[]>([]);
  const [processedStations, setProcessedStations] = useState<ProcessedStation[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [stationsLoading, setStationsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [lastFetchedType, setLastFetchedType] = useState<string | null>(null);

  // Recalculate whenever settings or stations change
  useEffect(() => {
    if (stations.length > 0) {
      setProcessedStations(processStations(stations, settings, stations));
    }
  }, [settings, stations]);

  const fetchStations = useCallback(
    async (loc: Location, fuelType: string) => {
      setStationsLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/stations?lat=${loc.lat}&lng=${loc.lng}&rad=${settings.radius}&type=${fuelType}`
        );
        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || "Fehler beim Laden der Tankstellen");
        }
        setStations(data.stations || []);
        setLastFetchedType(fuelType);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unbekannter Fehler");
      } finally {
        setStationsLoading(false);
      }
    },
    [settings.radius]
  );

  // Refetch when fuel type changes and we have a location
  useEffect(() => {
    if (location && lastFetchedType !== settings.fuelType) {
      fetchStations(location, settings.fuelType);
    }
  }, [settings.fuelType, location, lastFetchedType, fetchStations]);

  const requestLocation = useCallback(() => {
    setLocationLoading(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(loc);
        setLocationLoading(false);
        fetchStations(loc, settings.fuelType);
      },
      (err) => {
        setLocationLoading(false);
        setLocationError(
          err.code === 1
            ? "Standortzugriff verweigert. Bitte Berechtigungen prüfen."
            : "Standort konnte nicht ermittelt werden."
        );
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }, [fetchStations, settings.fuelType]);

  const refresh = useCallback(() => {
    if (location) fetchStations(location, settings.fuelType);
  }, [location, fetchStations, settings.fuelType]);

  const isLoading = locationLoading || stationsLoading;
  const hasStations = processedStations.length > 0;
  const cheapest = hasStations ? processedStations[0] : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <Gauge className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight">FuelSaver</h1>
              <p className="text-[10px] text-muted-foreground -mt-0.5">Effektiver Preisvergleich</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {location && (
              <button
                onClick={refresh}
                disabled={isLoading}
                className="p-2 rounded-lg hover:bg-secondary transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 text-muted-foreground ${isLoading ? "animate-spin" : ""}`} />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4 pb-20">
        {/* Summary banner when we have results */}
        <AnimatePresence>
          {cheapest && !isLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-2xl bg-gradient-to-r from-green-500/10 via-green-500/5 to-transparent border border-green-500/20 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Günstigste Option</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {cheapest.displayBrand}{" "}
                    <span className="text-muted-foreground font-normal text-xs">
                      · {cheapest.address}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    via{" "}
                    <span className="capitalize text-foreground">
                      {cheapest.bestOption === "payback"
                        ? "Payback"
                        : cheapest.bestOption === "circlek"
                        ? "Circle K"
                        : "Listenpreis"}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black font-mono text-green-400 tabular-nums">
                    {cheapest.bestPrice.toFixed(3)}
                  </div>
                  <div className="text-xs text-muted-foreground">€/Liter</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings */}
        <FuelSettings settings={settings} onChange={setSettings} />

        {/* Location button */}
        {!location && !locationLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <Button
              onClick={requestLocation}
              className="w-full h-12 text-sm font-semibold gap-2 shadow-lg shadow-primary/20"
            >
              <MapPin className="h-4 w-4" />
              Tankstellen in meiner Nähe finden
            </Button>
            {locationError && (
              <div className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-400">{locationError}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Loading */}
        {locationLoading && <LoadingState message="Standort wird ermittelt…" />}
        {stationsLoading && !locationLoading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-red-400">{error}</p>
              <button
                onClick={refresh}
                className="text-xs text-primary underline mt-1"
              >
                Erneut versuchen
              </button>
            </div>
          </div>
        )}

        {/* Station list */}
        {!stationsLoading && hasStations && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs text-muted-foreground">
                {processedStations.length} Tankstellen gefunden
              </p>
              <p className="text-xs text-muted-foreground">
                Sortiert nach effektivem Preis
              </p>
            </div>
            {processedStations.map((station, index) => (
              <StationCard
                key={station.id}
                station={station}
                index={index}
                showPayback={true}
                showCircleK={settings.circleKEnabled}
              />
            ))}
          </div>
        )}

        {/* No results */}
        {!stationsLoading && location && !hasStations && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 space-y-2"
          >
            <p className="text-2xl">🔍</p>
            <p className="text-sm text-muted-foreground">
              Keine Tankstellen in deiner Nähe gefunden.
            </p>
            <button
              onClick={refresh}
              className="text-xs text-primary underline"
            >
              Erneut suchen
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
