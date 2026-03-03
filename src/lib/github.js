import { NextResponse } from "next/server";
import { checkProjectAccess } from "@/lib/permissions";
import crypto from "crypto";

const RAW_ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default_32_byte_secret_key_12345";
const ENCRYPTION_KEY = crypto.createHash("sha256").update(String(RAW_ENCRYPTION_KEY)).digest();

const IV_LENGTH = 16;

export function decrypt(text) {
  if (!text) return null;
  const textParts = text.split(":");
  const iv = Buffer.from(textParts.shift(), "hex");
  const encryptedText = Buffer.from(textParts.join(":"), "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

/**
 * Utility to fetch GitHub resources using an encrypted user token.
 */
export async function fetchGitHub(projectId, endpoint) {
  const { isAuthorized, user, project, error } = await checkProjectAccess(projectId);
  
  if (!isAuthorized) {
    return { error: error || "Unauthorized", status: 403 };
  }

  if (!project.githubRepoOwner || !project.githubRepoName) {
     return { error: "GitHub repository not fully configured for this project", status: 400 };
  }

  if (!user.githubAccessToken) {
    return { error: "GitHub connection required", status: 401 };
  }

  let accessToken;
  try {
     accessToken = decrypt(user.githubAccessToken);
  } catch(e) {
     console.error("Token decryption failed", e);
     return { error: "Invalid GitHub connection token", status: 401 };
  }

  const url = `https://api.github.com/repos/${project.githubRepoOwner}/${project.githubRepoName}/${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
       const errData = await response.json().catch(()=>({}));
       return { error: errData.message || "Failed to fetch from GitHub", status: response.status };
    }

    const data = await response.json();
    return { data, status: 200 };
  } catch (err) {
      console.error(`GitHub API Error (${endpoint}):`, err);
      return { error: "Internal Server Error fetching from GitHub", status: 500 };
  }
}
