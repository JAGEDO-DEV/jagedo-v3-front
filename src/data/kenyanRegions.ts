import { kenyanLocations } from "./kenyaLocations";

// Kenyan administrative regions with their counties from kenyaLocations
export interface KenyanRegion {
  region: string;
  counties: string[];
}

export const kenyanRegions: KenyanRegion[] = [
  {
    region: "Central Region",
    counties: kenyanLocations
      .filter(loc => ["Kiambu", "Muranga", "Nyandarua", "Nyeri", "Kirinyaga"].includes(loc.county))
      .map(loc => loc.county)
  },
  {
    region: "Coast Region",
    counties: kenyanLocations
      .filter(loc => ["Mombasa", "Kwale", "Kilifi", "Lamu", "Tana River", "Taita Taveta"].includes(loc.county))
      .map(loc => loc.county)
  },
  {
    region: "Eastern Region",
    counties: kenyanLocations
      .filter(loc => ["Embu", "Kitui", "Machakos", "Makueni", "Tharaka-Nithi"].includes(loc.county))
      .map(loc => loc.county)
  },
  {
    region: "Nairobi Region",
    counties: kenyanLocations
      .filter(loc => ["Nairobi"].includes(loc.county))
      .map(loc => loc.county)
  },
  {
    region: "North Eastern Region",
    counties: kenyanLocations
      .filter(loc => ["Garissa", "Isiolo", "Mandera", "Marsabit", "Wajir"].includes(loc.county))
      .map(loc => loc.county)
  },
  {
    region: "Nyanza Region",
    counties: kenyanLocations
      .filter(loc => ["Kisii", "Kisumu", "Homa Bay", "Migori", "Nyamira", "Siaya"].includes(loc.county))
      .map(loc => loc.county)
  },
  {
    region: "Rift Valley Region",
    counties: kenyanLocations
      .filter(loc => ["Baringo", "Bomet", "Elgeyo-Marakwet", "Kajiado", "Kericho", "Laikipia", "Nakuru", "Narok", "Nandi", "Samburu", "Trans Nzoia", "Turkana", "Uasin Gishu", "West Pokot"].includes(loc.county))
      .map(loc => loc.county)
  },
  {
    region: "Western Region",
    counties: kenyanLocations
      .filter(loc => ["Bungoma", "Busia", "Kakamega", "Vihiga"].includes(loc.county))
      .map(loc => loc.county)
  }
];

// Helper function to get counties for a region
export const getCountiesForRegion = (region: string): string[] => {
  const found = kenyanRegions.find(r => r.region === region);
  return found ? found.counties : [];
};
