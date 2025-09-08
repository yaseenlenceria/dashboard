import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    throw new Error("Unauthorized: No session found");
  }
  
  const allowedEmails = (process.env.ALLOWED_EMAILS || "")
    .split(",")
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);
  
  if (allowedEmails.length > 0 && !allowedEmails.includes(session.user.email.toLowerCase())) {
    throw new Error("Unauthorized: Email not allowed");
  }
  
  return session;
}

export async function getOptionalSession() {
  try {
    return await getServerSession(authOptions);
  } catch {
    return null;
  }
}