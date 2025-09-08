"use client";

import { useState, useEffect } from "react";

interface Post {
  name: string;
  path: string;
  sha: string;
  slug: string;
  downloadUrl: string;
}

interface PostsListProps {
  onEditPost: (post: any) => void;
}

export default function PostsList({ onEditPost }: PostsListProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const response = await fetch("/api/posts");
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      } else {
        console.error("Failed to load posts");
      }
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (post: Post) => {
    try {
      const response = await fetch(`/api/posts/${post.name}`);
      if (response.ok) {
        const postData = await response.json();
        onEditPost(postData);
      } else {
        alert("Failed to load post for editing");
      }
    } catch (error) {
      alert("Error loading post for editing");
    }
  };

  const handleDelete = async (post: Post) => {
    if (!confirm(`Are you sure you want to delete "${post.name}"?`)) {
      return;
    }

    setDeleting(post.name);
    try {
      const response = await fetch(`/api/posts/${post.name}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sha: post.sha,
          message: `feat: delete blog post ${post.name}`
        })
      });

      if (response.ok) {
        setPosts(posts.filter(p => p.name !== post.name));
        alert("Post deleted successfully!");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete post");
      }
    } catch (error) {
      alert("Error deleting post");
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (filename: string) => {
    const match = filename.match(/^(\d{4}-\d{2}-\d{2})-/);
    if (match) {
      return new Date(match[1]).toLocaleDateString();
    }
    return "";
  };

  const getTitle = (filename: string) => {
    return filename
      .replace(/^\d{4}-\d{2}-\d{2}-/, "")
      .replace(/\.mdx$/, "")
      .replace(/-/g, " ")
      .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          <span className="ml-2">Loading posts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Blog Posts</h2>
          <span className="text-sm text-gray-500">{posts.length} posts</span>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          <p>No posts found. Create your first post!</p>
        </div>
      ) : (
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Post
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Filename
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {posts.map((post) => (
                <tr key={post.sha} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {getTitle(post.name)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {post.slug}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(post.name)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {post.name}
                    </code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(post)}
                        className="text-primary-600 hover:text-primary-900 px-2 py-1 rounded text-sm"
                      >
                        Edit
                      </button>
                      <a
                        href={post.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-gray-900 px-2 py-1 rounded text-sm"
                      >
                        View
                      </a>
                      <button
                        onClick={() => handleDelete(post)}
                        disabled={deleting === post.name}
                        className="text-red-600 hover:text-red-900 px-2 py-1 rounded text-sm disabled:opacity-50"
                      >
                        {deleting === post.name ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}