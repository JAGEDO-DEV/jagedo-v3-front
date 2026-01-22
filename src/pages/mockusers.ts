export const MOCK_USERS = [
  {
    username: "customer01@jagedo.co.ke",
    password: "Customer@123",
    userType: "CUSTOMER",
    profileType: "individual",
    firstName: "Customer",
    lastName: "Doe",
    adminApproved: true,
    userProfile: { complete: true }
  },
  {
    username: "customer02@jagedo.co.ke",
    password: "Customer@123",
    userType: "CUSTOMER",
    profileType: "organization",
    firstName: "Customer",
    lastName: "Smith",
    adminApproved: true,
    userProfile: { complete: true }
  },
  {
    username: "fundi01@jagedo.co.ke",
    password: "Builder@123",
    userType: "FUNDI",
    firstName: "Fundi",
    lastName: "One",
    adminApproved: false,
    userProfile: { complete: false }
  },
  {
    username: "professional01@jagedo.co.ke",
    password: "Builder@123",
    userType: "PROFESSIONAL",
    firstName: "Professional",
    lastName: "One",
    adminApproved: false,
    userProfile: { complete: false }
  },
  {
    username: "contractor01@jagedo.co.ke",
    password: "Builder@123",
    userType: "CONTRACTOR",
    firstName: "Contractor",
    lastName: "One",
    adminApproved: false,
    userProfile: { complete: false }
  },
  {
    username: "hardware01@jagedo.co.ke",
    password: "Builder@123",
    userType: "HARDWARE",
    firstName: "Hardware",
    lastName: "One",
    adminApproved: false,
    userProfile: { complete: false }
  },
  // ✅ Admin user
  {
    username: "admin@jagedo.co.ke",
    password: "Admin@123",
    userType: "ADMIN",
    firstName: "Admin",
    lastName: "User",
    adminApproved: true,
    userProfile: { complete: true }
  }
];
