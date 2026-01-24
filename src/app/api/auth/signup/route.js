import db from "@/lib/connectDb";
import User from "@/models/userModel";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
export async function POST(request) {
  try {
    await db();
    const user = await request.json();
    const { username, email, password } = user;
    if (email) {
      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });
      if (existingUser) {
        return NextResponse.json(
          { error: "User already exists with this email" },
          { status: 409 },
        );
      }
    }
    const hashedpassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      email,
      password: hashedpassword,
    });
    return NextResponse.json(
      { username, email },
      {
        status: 201,
      },
    );
  } catch (error) {
    return Response.json({ error: "Error registering user" }, { status: 400 });
  }
}
