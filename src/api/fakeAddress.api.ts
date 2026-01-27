const STORAGE_KEY = "user_addresses";

export interface Address {
  country: string;
  county: string;
  subCounty: string;
  estate: string;
}

const DEFAULT_ADDRESS: Address = {
  country: "Kenya",
  county: "Nairobi",
  subCounty: "Westlands",
  estate: "Paradise",
};

const getDB = (): Record<number, Address> => {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
};

const saveDB = (db: Record<number, Address>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
};

export const getUserAddress = (userId: number): Address => {
  const db = getDB();

  // If user not in DB → seed with defaults
  if (!db[userId]) {
    db[userId] = DEFAULT_ADDRESS;
    saveDB(db);
  }

  return db[userId];
};

export const updateUserAddress = (
  userId: number,
  address: Address
) => {
  const db = getDB();
  db[userId] = address;
  saveDB(db);
};
