import { getLoggedUser } from "@/lib/auth";
import db from "@/lib/connectDb";

export async function GET() {
  await db();
  const user = await getLoggedUser();
  return Response.json(user, { status: 200 });
}
