const STORAGE_KEY = "mock_users";

export interface MockUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  userProfile?: {
    profileImage?: string;
  };
}

// Seed data (your defaults)
const DEFAULT_USERS: MockUser[] = [
  {
    id: 1,
    firstName: "Lucy",
    lastName: "Chimoli",
    email: "lucy@test.com",
    phoneNumber: "0712345678",
    userProfile: {
      profileImage: "https://i.pravatar.cc/150?img=47",
    },
  },
  {
    id: 2,
    firstName: "John",
    lastName: "Doe",
    email: "john@test.com",
    phoneNumber: "0799999999",
    userProfile: {
      profileImage: "https://i.pravatar.cc/150?img=12",
    },
  },
];

const getDB = (): Record<number, MockUser> => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const map = Object.fromEntries(
      DEFAULT_USERS.map((u) => [u.id, u])
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    return map;
  }
  return JSON.parse(stored);
};

const saveDB = (db: Record<number, MockUser>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
};

export const getUser = (id: number): MockUser => {
  const db = getDB();
  return db[id];
};

export const updateUser = (id: number, data: Partial<MockUser>) => {
  const db = getDB();
  db[id] = { ...db[id], ...data };
  saveDB(db);
};

export const updateUserProfileImage = (id: number, url: string) => {
  const db = getDB();
  db[id].userProfile = {
    ...db[id].userProfile,
    profileImage: url,
  };
  saveDB(db);
};
