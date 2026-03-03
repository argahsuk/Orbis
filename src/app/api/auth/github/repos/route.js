import { NextResponse } from "next/server";
import { getLoggedUser } from "@/lib/auth";
import { decrypt } from "@/lib/github";

export async function GET(request) {
  try {
    const user = await getLoggedUser();
    
    if (!user || (!user.githubId && !user.githubAccessToken)) {
      return NextResponse.json({ error: "GitHub not connected" }, { status: 403 });
    }

    const token = decrypt(user.githubAccessToken);
    
    if (!token) {
      return NextResponse.json({ error: "Invalid GitHub token" }, { status: 403 });
    }

    const response = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch repositories from GitHub" }, { status: response.status });
    }

    const repos = await response.json();
    
    // Map to a simpler structure for the frontend
    const mappedRepos = repos.map(repo => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      owner: repo.owner.login,
      private: repo.private,
      url: repo.html_url,
    }));

    return NextResponse.json(mappedRepos, { status: 200 });
  } catch (error) {
    console.error("Fetch User Repos Error:", error);
    return NextResponse.json({ error: "Failed to fetch GitHub repositories" }, { status: 500 });
  }
}
