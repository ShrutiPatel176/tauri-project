import { db } from "@/db";

/* ---------------- SIGN UP ---------------- */
export async function signupUser(data) {
  const { username, email, password, country, role } = data;

  const existing = await db.users.where("email").equals(email).first();
  if (existing) throw new Error("Email already exists");

  const id = await db.users.add({
    username,
    email,
    password,
    role,                     // ✅ SAVE ROLE
    country: role === "admin" ? null : country,
    createdAt: new Date().toISOString(),
  });

  return id;
}

/* ---------------- LOGIN ---------------- */
export async function loginUser({ email, password }) {
  const user = await db.users
    .where("email")
    .equals(email)
    .first();

  if (!user || user.password !== password) {
    throw new Error("Invalid credentials");
  }

  // ✅ CORRECT LOCAL STORAGE (NO PASSWORD)
  localStorage.setItem(
    "user",
    JSON.stringify({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,        // ✅ REQUIRED
      country: user.country,
    })
  );

  return user;
}
