import { getUserSession } from "@/lib/auth";
import Session from "@/models/sessionModel";
import { cookies } from "next/headers";

export async function POST() {
  const sessionId = await getUserSession();
  const cookieStore = await cookies();
  cookieStore.delete("UserId");
  await Session.findByIdAndDelete(sessionId);
  return new Response(null, { status: 204 });
}
