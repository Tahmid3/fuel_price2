// /types/index.ts

export interface TankerkoenigStation {
  id: string;
  name: string;
  brand: string;
  street: string;
  place: string;
  houseNumber: string;
  postCode: number;
  lat: number;
  lng: number;
  dist: number;
  price: number | null;
  isOpen: boolean;
  e5?: number | false;
  e10?: number | false;
  diesel?: number | false;
}

export interface TankerkoenigResponse {
  ok: boolean;
  license: string;
  data: string;
  stations: TankerkoenigStation[];
  message?: string;
}

export interface ProcessedStation {
  id: string;
  brand: string;
  displayBrand: string;
  name: string;
  address: string;
  distance: number;
  listedPrice: number;
  paybackEffectivePrice: number | null;
  circleKEffectivePrice: number | null;
  bestPrice: number;
  bestOption: "listed" | "payback" | "circlek";
  isOverallCheapest: boolean;
  breakEvenDelta: number | null;
  isOpen: boolean;
  lat: number;
  lng: number;
}

export interface UserSettings {
  fuelType: "e5" | "e10" | "diesel";
  liters: number;
  couponMultiplier: 1 | 3 | 5 | 7;
  turboEnabled: boolean;
  circleKEnabled: boolean;
  pointValueCents: number;
  radius: number;
}

export interface Location {
  lat: number;
  lng: number;
}
