"use client";

import { useState, useEffect } from "react";

interface PostEditorProps {
  editingPost?: any;
  onPostSaved: () => void;
  onCancel: () => void;
}

export default function PostEditor({ editingPost, onPostSaved, onCancel }: PostEditorProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    cover: "/blog-images/baby-naps.svg",
    content: "## Start writing here…",
    category: "Sleep Optimization",
    readMinutes: 8,
    seoTitle: "",
    seoDescription: "",
    keywords: "",
    date: new Date().toISOString(),
  });

  useEffect(() => {
    if (editingPost) {
      const { frontmatter, content } = editingPost;
      setFormData({
        title: frontmatter.title || "",
        slug: editingPost.filename ? editingPost.filename.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/\.mdx$/, "") : "",
        excerpt: frontmatter.excerpt || "",
        cover: frontmatter.cover || "/blog-images/baby-naps.svg",
        content: content || "",
        category: frontmatter.category || "Sleep Optimization",
        readMinutes: frontmatter.readMinutes || 8,
        seoTitle: frontmatter.seo?.metaTitle || "",
        seoDescription: frontmatter.seo?.metaDescription || "",
        keywords: frontmatter.seo?.keywords || "",
        date: frontmatter.date || new Date().toISOString(),
      });
    }
  }, [editingPost]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const frontmatter = {
        title: formData.title,
        date: formData.date,
        readMinutes: formData.readMinutes,
        category: formData.category,
        cover: formData.cover,
        excerpt: formData.excerpt,
        seo: {
          metaTitle: formData.seoTitle || formData.title,
          metaDescription: formData.seoDescription || formData.excerpt,
          keywords: formData.keywords,
          ogImage: formData.cover,
          canonical: `https://sleepcycle.io/blog/${formData.slug}`
        }
      };

      if (editingPost) {
        // Update existing post
        const response = await fetch(`/api/posts/${editingPost.filename}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            frontmatter,
            content: formData.content,
            sha: editingPost.sha,
            message: `feat: update blog post "${formData.title}"`
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update post");
        }
      } else {
        // Create new post
        const response = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            frontmatter,
            content: formData.content,
            slug: formData.slug,
            date: formData.date
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create post");
        }
      }

      alert(editingPost ? "Post updated successfully!" : "Post created successfully!");
      onPostSaved();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", file.name);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setFormData(prev => ({ ...prev, cover: result.url }));
        alert("Image uploaded successfully!");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to upload image");
      }
    } catch (error) {
      alert("Failed to upload image");
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">
          {editingPost ? "Edit Post" : "Create New Post"}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter post title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug *
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="url-friendly-slug"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="datetime-local"
                value={new Date(formData.date).toISOString().slice(0, 16)}
                onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value).toISOString() })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Excerpt
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Brief description of the post"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="Sleep Optimization">Sleep Optimization</option>
                <option value="Health & Wellness">Health & Wellness</option>
                <option value="Baby Sleep">Baby Sleep</option>
                <option value="Sleep Science">Sleep Science</option>
                <option value="Tips & Tricks">Tips & Tricks</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Read Minutes
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={formData.readMinutes}
                onChange={(e) => setFormData({ ...formData, readMinutes: parseInt(e.target.value) || 8 })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cover Image
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={formData.cover}
                  onChange={(e) => setFormData({ ...formData, cover: e.target.value })}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="/blog-images/image.svg"
                />
                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md text-sm font-medium">
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])}
                  />
                </label>
              </div>
            </div>

            {/* SEO Section */}
            <details className="border border-gray-200 rounded-md">
              <summary className="cursor-pointer p-3 bg-gray-50 font-medium text-sm">
                SEO Settings
              </summary>
              <div className="p-3 space-y-3 bg-white">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    value={formData.seoTitle}
                    onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Leave empty to use post title"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Meta Description
                  </label>
                  <textarea
                    value={formData.seoDescription}
                    onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                    rows={2}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Leave empty to use excerpt"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Keywords
                  </label>
                  <input
                    type="text"
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="comma, separated, keywords"
                  />
                </div>
              </div>
            </details>
          </div>
        </div>

        {/* Content Editor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Content (Markdown) *
          </label>
          <textarea
            required
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={20}
            className="w-full border border-gray-300 rounded-md px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Write your post content in Markdown..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Use Markdown syntax. You can reference images like: ![Alt text](/blog-images/image.svg)
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-primary-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : (editingPost ? "Update Post" : "Create Post")}
          </button>
        </div>
      </form>
    </div>
  );
}