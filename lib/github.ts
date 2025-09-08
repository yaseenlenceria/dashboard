import jwt from "jsonwebtoken";

const GH_API = "https://api.github.com";

export async function getInstallationToken(): Promise<string> {
  if (!process.env.GITHUB_APP_ID || !process.env.GITHUB_APP_PRIVATE_KEY || !process.env.GITHUB_INSTALLATION_ID) {
    throw new Error("Missing GitHub App configuration");
  }

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now - 60,
    exp: now + (10 * 60),
    iss: process.env.GITHUB_APP_ID
  };

  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, '\n');
  const jwtToken = jwt.sign(payload, privateKey, { algorithm: "RS256" });

  const res = await fetch(`${GH_API}/app/installations/${process.env.GITHUB_INSTALLATION_ID}/access_tokens`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwtToken}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "SleepCycle-Dashboard/1.0.0"
    }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create installation token: ${res.status} ${errorText}`);
  }

  const json = await res.json();
  return json.token;
}

const repoBase = () =>
  `${GH_API}/repos/${process.env.GITHUB_REPO_OWNER}/${process.env.GITHUB_REPO_NAME}`;

export async function ghListDir(path: string): Promise<any[]> {
  const token = await getInstallationToken();
  const encodedPath = encodeURIComponent(path);
  const url = `${repoBase()}/contents/${encodedPath}?ref=${process.env.GITHUB_BRANCH || 'main'}`;
  
  const res = await fetch(url, {
    headers: { 
      Authorization: `Bearer ${token}`, 
      Accept: "application/vnd.github+json",
      "User-Agent": "SleepCycle-Dashboard/1.0.0"
    }
  });
  
  if (!res.ok) {
    if (res.status === 404) return [];
    const errorText = await res.text();
    throw new Error(`Failed to list directory: ${res.status} ${errorText}`);
  }
  
  const result = await res.json();
  return Array.isArray(result) ? result : [];
}

export async function ghGetFile(path: string): Promise<any> {
  const token = await getInstallationToken();
  const encodedPath = encodeURIComponent(path);
  const url = `${repoBase()}/contents/${encodedPath}?ref=${process.env.GITHUB_BRANCH || 'main'}`;
  
  const res = await fetch(url, {
    headers: { 
      Authorization: `Bearer ${token}`, 
      Accept: "application/vnd.github+json",
      "User-Agent": "SleepCycle-Dashboard/1.0.0"
    }
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`File not found: ${res.status} ${errorText}`);
  }
  
  return res.json();
}

export async function ghPutFile(
  path: string, 
  content: string, 
  message: string, 
  sha?: string,
  isBinary = false
): Promise<any> {
  const token = await getInstallationToken();
  const encodedPath = encodeURIComponent(path);
  
  const body = {
    message,
    content: isBinary ? content : Buffer.from(content, "utf8").toString("base64"),
    branch: process.env.GITHUB_BRANCH || 'main',
    ...(sha ? { sha } : {})
  };
  
  const res = await fetch(`${repoBase()}/contents/${encodedPath}`, {
    method: "PUT",
    headers: { 
      Authorization: `Bearer ${token}`, 
      Accept: "application/vnd.github+json",
      "User-Agent": "SleepCycle-Dashboard/1.0.0",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Commit failed: ${res.status} ${errorText}`);
  }
  
  return res.json();
}

export async function ghPutBinaryFile(
  path: string, 
  base64Content: string, 
  message: string, 
  sha?: string
): Promise<any> {
  return ghPutFile(path, base64Content, message, sha, true);
}

export async function ghDeleteFile(path: string, message: string, sha: string): Promise<any> {
  const token = await getInstallationToken();
  const encodedPath = encodeURIComponent(path);
  
  const res = await fetch(`${repoBase()}/contents/${encodedPath}`, {
    method: "DELETE",
    headers: { 
      Authorization: `Bearer ${token}`, 
      Accept: "application/vnd.github+json",
      "User-Agent": "SleepCycle-Dashboard/1.0.0",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ 
      message, 
      sha, 
      branch: process.env.GITHUB_BRANCH || 'main' 
    })
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Delete failed: ${res.status} ${errorText}`);
  }
  
  return res.json();
}

export function parseFrontmatter(content: string): { frontmatter: any, body: string } {
  const frontmatterRegex = /^export const frontmatter = ({[\s\S]*?})\s*\n\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (match) {
    try {
      const frontmatter = eval(`(${match[1]})`);
      return { frontmatter, body: match[2] };
    } catch (e) {
      console.error('Error parsing frontmatter:', e);
    }
  }
  
  return { frontmatter: {}, body: content };
}

export function createMdxContent(frontmatter: any, body: string): string {
  return `export const frontmatter = ${JSON.stringify(frontmatter, null, 2)}

${body}
`;
}