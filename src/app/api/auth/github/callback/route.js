import { NextResponse } from "next/server";
import connectDb from "@/lib/connectDb";
import User from "@/models/userModel";
import Session from "@/models/sessionModel";
import { getLoggedUser } from "@/lib/auth";
import { signCookie } from "@/app/api/auth/login/route";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";

const RAW_ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default_32_byte_secret_key_12345";
// Hash the key to ensure it is exactly 32 bytes for aes-256-cbc
const ENCRYPTION_KEY = crypto.createHash("sha256").update(String(RAW_ENCRYPTION_KEY)).digest();

const IV_LENGTH = 16;

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    
    if (!code) {
      return NextResponse.json({ error: "No code provided" }, { status: 400 });
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_CALLBACK_URL || new URL('/api/auth/github/callback', request.url).toString(),
      }),
    });

    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      return NextResponse.json({ error: tokenData.error_description || "GitHub authentication failed" }, { status: 400 });
    }

    const accessToken = tokenData.access_token;

    // Get GitHub user data
    const githubUserResponse = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    if (!githubUserResponse.ok) {
         return NextResponse.json({ error: "Failed to fetch GitHub user details" }, { status: 400 });
    }
    
    const githubUserData = await githubUserResponse.json();

    // Fetch primary email (since it might be private in /user)
    let email = `${githubUserData.login}@github.com`; // Fallback
    try {
      const githubEmailsResponse = await fetch("https://api.github.com/user/emails", {
         headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (githubEmailsResponse.ok) {
        const githubEmails = await githubEmailsResponse.json();
        if (Array.isArray(githubEmails)) {
          const primaryEmailObj = githubEmails.find(e => e.primary) || githubEmails[0];
          if (primaryEmailObj && primaryEmailObj.email) {
            email = primaryEmailObj.email;
          }
        }
      }
    } catch (e) {
      console.warn("Could not fetch GitHub emails, using fallback.");
    }

    const encryptedToken = encrypt(accessToken);

    await connectDb();
    const loggedInUser = await getLoggedUser();

    // Scenario 1: User is already logged in, mapping GitHub to existing account
    if (loggedInUser && loggedInUser._id) {
       await User.findByIdAndUpdate(loggedInUser._id, {
         githubId: githubUserData.id.toString(),
         githubUsername: githubUserData.login,
         githubAccessToken: encryptedToken,
       });
       return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Scenario 2: Login via GitHub Flow
    let user = await User.findOne({ githubId: githubUserData.id.toString() });

    if (!user) {
       // Check if an account with this email already exists
       user = await User.findOne({ email });
       
       if (user) {
          // Link GitHub data to existing email account
          user.githubId = githubUserData.id.toString();
          user.githubUsername = githubUserData.login;
          user.githubAccessToken = encryptedToken;
          await user.save();
       } else {
          // Create a brand new account
          const hashedPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
          user = await User.create({
             username: githubUserData.login,
             email: email,
             password: hashedPassword, // Dummy password since they login via GitHub
             githubId: githubUserData.id.toString(),
             githubUsername: githubUserData.login,
             githubAccessToken: encryptedToken,
          });
       }
    } else {
       // User exists, just update their token in case it changed
       user.githubAccessToken = encryptedToken;
       user.githubUsername = githubUserData.login;
       await user.save();
    }

    // Create session and log them in
    const session = await Session.create({ userId: user._id });
    const cookieStore = await cookies();
    cookieStore.set("UserId", signCookie(session.id), {
      httpOnly: true,
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return NextResponse.redirect(new URL("/dashboard", request.url));
    
  } catch (error) {
    console.error("GitHub Callback Error:", error);
    return NextResponse.redirect(new URL("/login?error=GitHub_Auth_Failed", request.url));
  }
}
