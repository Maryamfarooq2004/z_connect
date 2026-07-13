import dotenv from "dotenv";
import path from "path";
import axios from "axios";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const BASE_URL = "http://localhost:3000";

interface TestReport {
  endpoint: string;
  method: string;
  status: "WORKING" | "NOT WORKING";
  flowDescription: string;
  errorDetails?: string;
}

const reports: TestReport[] = [];

async function testEndpoint(
  name: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  pathStr: string,
  payload?: any,
  headers?: any
) {
  try {
    const res = await axios({
      method,
      url: `${BASE_URL}${pathStr}`,
      data: payload,
      headers,
      validateStatus: () => true, // resolve promise for any status code
    });

    // Check working criteria
    const isWorking = res.status >= 200 && res.status < 400;
    reports.push({
      endpoint: pathStr,
      method,
      status: isWorking ? "WORKING" : "NOT WORKING",
      flowDescription: `Returned status code ${res.status}. Response: ${JSON.stringify(res.data)}`,
      errorDetails: !isWorking ? `HTTP Status ${res.status}: ${JSON.stringify(res.data)}` : undefined,
    });
  } catch (err: any) {
    reports.push({
      endpoint: pathStr,
      method,
      status: "NOT WORKING",
      flowDescription: "Request execution threw a network or runtime exception.",
      errorDetails: err.message,
    });
  }
}

async function runAllTests() {
  console.log("Testing all API Endpoints...");

  // 1. Health checks
  await testEndpoint("Root health", "GET", "/api");
  await testEndpoint("Health check", "GET", "/api/health");

  // 2. Authentication flows
  const testEmail = `tester_${Math.floor(Math.random() * 10000)}@zconnect.design`;
  const signupPayload = {
    first_name: "Test",
    last_name: "User",
    email: testEmail,
    password: "Password123!",
  };

  // Sign up
  console.log("Testing Signup...");
  await testEndpoint("Signup", "POST", "/api/auth/signup", signupPayload);

  // Verification Token extraction (directly fetch from local database for validation flow)
  const { MongoClient } = require("mongodb");
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db();
  const userDoc = await db.collection("users").findOne({ email: testEmail });
  const token = userDoc?.verificationToken || "";

  // Verify Email
  await testEndpoint("Verify Email", "GET", `/api/auth/verify-email?token=${token}`);

  // Resend verification
  await testEndpoint("Resend verification", "POST", "/api/auth/resend-verification", { email: testEmail });

  // Login
  console.log("Testing Login...");
  await testEndpoint("Login", "POST", "/api/auth/login", {
    username: testEmail,
    password: "Password123!",
  });

  // Extract authentication tokens for user endpoints
  const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
    username: testEmail,
    password: "Password123!",
  });

  const accessToken = loginRes.data?.accessToken || "";
  const authHeaders = { Authorization: `Bearer ${accessToken}` };

  // Forgot password
  await testEndpoint("Forgot Password", "POST", "/api/auth/forgot-password", { email: testEmail });
  const freshUser = await db.collection("users").findOne({ email: testEmail });
  const resetOtp = freshUser?.resetOtp || "123456";

  // Verify Otp
  await testEndpoint("Verify Reset OTP", "POST", "/api/auth/verify-reset-otp", { email: testEmail, otp: resetOtp });

  // Reset Password
  await testEndpoint("Reset Password", "POST", "/api/auth/reset-password", {
    email: testEmail,
    otp: resetOtp,
    newPassword: "NewPassword123!",
  });

  // Apple & Google sign in simulations
  await testEndpoint("Google Login", "POST", "/api/auth/login-with-google", { token: "google-token-mock" });
  await testEndpoint("Apple Login", "POST", "/api/auth/login-with-apple", { token: "apple-token-mock" });

  // Token refresh
  const cookieHeader = { Cookie: `zconnect_refresh_token=${loginRes.data?.refreshToken || ""}` };
  await testEndpoint("Refresh token", "POST", "/api/auth/refresh", {}, cookieHeader);

  // Authenticated user operations
  await testEndpoint("Get Me Profile", "GET", "/api/user/me", {}, authHeaders);
  
  // Profile update
  await testEndpoint("Update Profile", "POST", "/api/auth/update-profile", {
    first_name: "Updated",
    last_name: "Tester",
    bio: "Test account updated bio",
  }, authHeaders);

  // Change password
  await testEndpoint("Change Password", "POST", "/api/auth/change-password", {
    oldPassword: "NewPassword123!",
    newPassword: "Password123!",
  }, authHeaders);

  // Invite Manager
  const managerEmail = `manager_${Math.floor(Math.random() * 10000)}@zconnect.design`;
  await testEndpoint("Invite Manager", "POST", "/api/user/invite-manager", {
    first_name: "Office",
    last_name: "Manager",
    email: managerEmail,
    password: "Password123!",
  }, authHeaders);

  // List Managers
  await testEndpoint("List Managers", "GET", "/api/user/managers", {}, authHeaders);

  // Retrieve invited manager ID
  const invitedManager = await db.collection("users").findOne({ email: managerEmail });
  const managerId = invitedManager?._id.toString() || "";

  // Get Manager detail
  await testEndpoint("Get Manager detail", "GET", `/api/user/manager/${managerId}`, {}, authHeaders);

  // Update Manager
  await testEndpoint("Update Manager", "PATCH", "/api/user/update-manager", {
    id: managerId,
    first_name: "Curator",
    last_name: "Manager",
  }, authHeaders);

  // User change password scoped
  await testEndpoint("User scoped Change Password", "PATCH", "/api/user/change-password", {
    oldPassword: "Password123!",
    newPassword: "NewPassword123!",
  }, authHeaders);

  // Upload profile photo
  await testEndpoint("Upload avatar photo registry", "POST", "/api/user/upload-image", { imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb" }, authHeaders);

  // Remove profile photo
  await testEndpoint("Remove avatar photo registry", "DELETE", "/api/user/remove-image", {}, authHeaders);

  // Media Operations (AWS registry mocks)
  await testEndpoint("Upload file registry", "POST", "/api/aws/upload", {
    fileName: "document.pdf",
    fileSize: "2.1 MB",
    fileType: "pdf",
    fileUrl: "https://s3.amazonaws.com/document.pdf",
  }, authHeaders);

  // Fetch file list
  await testEndpoint("Fetch files list", "GET", "/api/aws/fetch-content", {}, authHeaders);
  const mediaDoc = await db.collection("media").findOne({ userId: userDoc?._id.toString() });
  const fileId = mediaDoc?._id.toString() || "";

  // Delete file
  await testEndpoint("Delete file registry", "DELETE", `/api/aws/file?id=${fileId}`, {}, authHeaders);

  // Delete User
  await testEndpoint("Delete User", "DELETE", `/api/user/${userDoc?._id.toString() || loginRes.data?.user?.id}`, {}, authHeaders);

  // Logout session
  await testEndpoint("Logout", "POST", "/api/auth/logout", {});

  await client.close();

  // Print formatted test results
  console.log("\n=================== API TESTING REPORT ===================");
  reports.forEach(rep => {
    console.log(`[${rep.status}] ${rep.method} ${rep.endpoint}`);
    console.log(` -> Flow: ${rep.flowDescription}`);
    if (rep.errorDetails) {
      console.log(` -> Error: ${rep.errorDetails}`);
    }
    console.log("----------------------------------------------------------");
  });
}

runAllTests();
