import { NextResponse } from "next/server";
import { fetchGitHub } from "@/lib/github";

export async function GET(req, { params }) {
  const { id: projectId } = await params;
  const { data, error, status } = await fetchGitHub(projectId, "releases");
  
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  return NextResponse.json(data);
}
