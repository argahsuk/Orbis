import db from "@/lib/connectDb";
import User from "@/models/userModel";
import { cookies } from "next/headers";
import { createHmac } from "crypto";
import Session from "@/models/sessionModel";
import bcrypt from "bcrypt";
export async function POST(request) {
  await db();
  const cookieStore = await cookies();
  const { email, password } = await request.json();
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return Response.json(
        { error: "Invalid Credentials!" },
        {
          status: 401,
        }
      );
    }
    if (!(await bcrypt.compare(password, user.password))) {
      return Response.json({ error: "Invalid Credentials!" },
         { status: 401 });
    }
    const session = await Session.create({ userId: user._id });
    cookieStore.set("UserId", signCookie(session.id), {
      httpOnly: true,
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return Response.json({ message: "Login successfull" }, { status: 201 });
  } catch (error) {
    return Response.json({ error: "Error logging in user" }, { status: 400 });
  }
}
export function signCookie(cookie) {
  const signature = createHmac("sha256", process.env.COOKIE_SECRET)
    .update(cookie)
    .digest("hex");

  return `${cookie}.${signature}`;
}
