import { NextResponse } from "next/server";

export async function GET(request) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.GITHUB_CALLBACK_URL;
  
  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: "Missing GitHub OAuth configuration." }, { status: 500 });
  }

  // Request repo and read:user scopes as per PRD
  const scope = "repo read:user";
  const state = Math.random().toString(36).substring(7); 

  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.append("client_id", clientId);
  githubAuthUrl.searchParams.append("redirect_uri", redirectUri || new URL('/api/auth/github/callback', request.url).toString());
  githubAuthUrl.searchParams.append("scope", scope);
  githubAuthUrl.searchParams.append("state", state);

  return NextResponse.redirect(githubAuthUrl.toString());
}
