import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-guard";
import { ghListDir, ghPutFile, createMdxContent } from "@/lib/github";

export async function GET() {
  try {
    await requireSession();
    
    const items = await ghListDir("content/posts");
    
    const posts = items
      .filter((item: any) => item.name.endsWith('.mdx'))
      .map((item: any) => ({
        name: item.name,
        path: item.path,
        sha: item.sha,
        slug: item.name.replace(/\.mdx$/, ''),
        downloadUrl: item.download_url
      }))
      .sort((a: any, b: any) => b.name.localeCompare(a.name)); // Sort by filename desc (newest first)

    return NextResponse.json({ posts });
  } catch (error: any) {
    console.error('Failed to list posts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list posts' },
      { status: error.message.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSession();
    
    const body = await req.json();
    const { frontmatter, content, slug, date } = body;
    
    if (!frontmatter?.title || !slug || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: title, slug, and content are required' },
        { status: 400 }
      );
    }

    const datePrefix = date ? new Date(date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
    const sanitizedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    const filename = `${datePrefix}-${sanitizedSlug}.mdx`;
    const path = `content/posts/${filename}`;

    const mdxContent = createMdxContent(frontmatter, content);
    
    const result = await ghPutFile(
      path,
      mdxContent,
      `feat: create blog post "${frontmatter.title}"`
    );

    return NextResponse.json({
      success: true,
      path,
      filename,
      commit: result
    });
  } catch (error: any) {
    console.error('Failed to create post:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create post' },
      { status: error.message.includes('Unauthorized') ? 401 : 500 }
    );
  }
}