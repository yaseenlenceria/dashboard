"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import PostEditor from "./components/PostEditor";
import PostsList from "./components/PostsList";
import ImageManager from "./components/ImageManager";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'create' | 'posts' | 'images'>('create');
  const [editingPost, setEditingPost] = useState<any>(null);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleEditPost = (post: any) => {
    setEditingPost(post);
    setActiveTab('create');
  };

  const handlePostSaved = () => {
    setEditingPost(null);
    setActiveTab('posts');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                SleepCycle Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {session.user?.name || session.user?.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'create', label: editingPost ? 'Edit Post' : 'Create Post' },
              { id: 'posts', label: 'All Posts' },
              { id: 'images', label: 'Images' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id !== 'create') setEditingPost(null);
                  setActiveTab(tab.id as any);
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {activeTab === 'create' && (
          <PostEditor 
            editingPost={editingPost} 
            onPostSaved={handlePostSaved}
            onCancel={() => {
              setEditingPost(null);
              setActiveTab('posts');
            }}
          />
        )}
        {activeTab === 'posts' && (
          <PostsList onEditPost={handleEditPost} />
        )}
        {activeTab === 'images' && (
          <ImageManager />
        )}
      </main>
    </div>
  );
}