import User from "@/models/userModel";
import { cookies } from "next/headers";
import { signCookie } from "@/app/api/auth/login/route";
import Session from "@/models/sessionModel";

export async function getLoggedUser() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("UserId")?.value;
  if (!cookie) return null;

  const sessionId = verifyCookie(cookie);
  if (!sessionId) return null;

  const session = await Session.findById(sessionId);
  if (!session) return null;

  const user = await User.findById(session.userId).select("-password -__v");
  if (!user) return null;

  return user;
}

export function verifyCookie(signedCookie) {
  if (!signedCookie) return false;

  const [cookie, cookieSignature] = signedCookie.split(".");
  const signature = signCookie(cookie).split(".")[1];

  if (signature === cookieSignature) {
    return cookie;
  }

  return false;
}

export async function getUserSession() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("UserId")?.value;
  return verifyCookie(cookie);
}
