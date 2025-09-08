import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-guard";
import { ghGetFile, ghPutFile, ghDeleteFile, parseFrontmatter, createMdxContent } from "@/lib/github";

interface RouteParams {
  params: { path: string[] }
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    await requireSession();
    
    const relativePath = params.path.join("/");
    
    if (!relativePath.startsWith("content/posts/") && !relativePath.includes("/")) {
      // If just a filename is provided, assume it's in content/posts/
      const fullPath = `content/posts/${relativePath}`;
      const file = await ghGetFile(fullPath);
      const content = Buffer.from(file.content, "base64").toString("utf8");
      const { frontmatter, body } = parseFrontmatter(content);
      
      return NextResponse.json({
        path: fullPath,
        filename: relativePath,
        sha: file.sha,
        frontmatter,
        content: body,
        rawContent: content
      });
    } else {
      const file = await ghGetFile(relativePath);
      const content = Buffer.from(file.content, "base64").toString("utf8");
      const { frontmatter, body } = parseFrontmatter(content);
      
      return NextResponse.json({
        path: relativePath,
        filename: relativePath.split("/").pop(),
        sha: file.sha,
        frontmatter,
        content: body,
        rawContent: content
      });
    }
  } catch (error: any) {
    console.error('Failed to get post:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get post' },
      { status: error.message.includes('Unauthorized') ? 401 : error.message.includes('not found') ? 404 : 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    await requireSession();
    
    const body = await req.json();
    const { frontmatter, content, sha, message } = body;
    
    if (!content || !sha) {
      return NextResponse.json(
        { error: 'Content and SHA are required for updates' },
        { status: 400 }
      );
    }

    const relativePath = params.path.join("/");
    const fullPath = relativePath.startsWith("content/posts/") ? relativePath : `content/posts/${relativePath}`;
    
    let finalContent: string;
    if (frontmatter) {
      finalContent = createMdxContent(frontmatter, content);
    } else {
      finalContent = content;
    }
    
    const commitMessage = message || `feat: update blog post in ${fullPath.split("/").pop()}`;
    
    const result = await ghPutFile(fullPath, finalContent, commitMessage, sha);
    
    return NextResponse.json({
      success: true,
      path: fullPath,
      commit: result
    });
  } catch (error: any) {
    console.error('Failed to update post:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update post' },
      { status: error.message.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    await requireSession();
    
    const body = await req.json();
    const { sha, message } = body;
    
    if (!sha) {
      return NextResponse.json(
        { error: 'SHA is required for deletion' },
        { status: 400 }
      );
    }

    const relativePath = params.path.join("/");
    const fullPath = relativePath.startsWith("content/posts/") ? relativePath : `content/posts/${relativePath}`;
    
    const commitMessage = message || `feat: delete blog post ${fullPath.split("/").pop()}`;
    
    const result = await ghDeleteFile(fullPath, commitMessage, sha);
    
    return NextResponse.json({
      success: true,
      path: fullPath,
      commit: result
    });
  } catch (error: any) {
    console.error('Failed to delete post:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete post' },
      { status: error.message.includes('Unauthorized') ? 401 : 500 }
    );
  }
}