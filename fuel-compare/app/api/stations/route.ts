import { NextRequest, NextResponse } from "next/server";
import { isSupportedBrand } from "@/utils/fuelCalculator";

const TANKERKOENIG_API_KEY = "b09160a3-a6c6-41fa-9ad8-94f3af9cbc42";
const TANKERKOENIG_URL = "https://creativecommons.tankerkoenig.de/json/list.php";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const rad = searchParams.get("rad") || "5";
  const type = searchParams.get("type") || "e5";

  if (!lat || !lng) {
    return NextResponse.json({ error: "Missing lat/lng parameters" }, { status: 400 });
  }

  try {
    const url = new URL(TANKERKOENIG_URL);
    url.searchParams.set("lat", lat);
    url.searchParams.set("lng", lng);
    url.searchParams.set("rad", rad);
    url.searchParams.set("sort", "price");
    url.searchParams.set("type", type);
    url.searchParams.set("apikey", TANKERKOENIG_API_KEY);

    const response = await fetch(url.toString(), {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`Tankerkoenig API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.message || "Tankerkoenig API returned error");
    }

    // Filter to supported brands only
    const filteredStations = (data.stations || []).filter((station: { brand: string }) =>
      isSupportedBrand(station.brand)
    );

    return NextResponse.json({
      ok: true,
      stations: filteredStations,
    });
  } catch (error) {
    console.error("Failed to fetch stations:", error);
    return NextResponse.json(
      { error: "Failed to fetch fuel prices. Please try again." },
      { status: 500 }
    );
  }
}
