"use client";

import { useState, useEffect, useRef } from "react";

interface Image {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  downloadUrl: string;
}

export default function ImageManager() {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const response = await fetch("/api/upload");
      if (response.ok) {
        const data = await response.json();
        setImages(data.images || []);
      } else {
        console.error("Failed to load images");
      }
    } catch (error) {
      console.error("Error loading images:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadPromises = Array.from(files).map(async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", file.name);

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData
        });

        if (response.ok) {
          return await response.json();
        } else {
          const error = await response.json();
          throw new Error(error.error || "Failed to upload");
        }
      } catch (error: any) {
        console.error(`Failed to upload ${file.name}:`, error);
        alert(`Failed to upload ${file.name}: ${error.message}`);
        return null;
      }
    });

    try {
      const results = await Promise.all(uploadPromises);
      const successful = results.filter(r => r !== null);
      
      if (successful.length > 0) {
        alert(`Successfully uploaded ${successful.length} image(s)!`);
        loadImages(); // Reload the list
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (image: Image) => {
    if (!confirm(`Are you sure you want to delete "${image.name}"?`)) {
      return;
    }

    setDeleting(image.name);
    try {
      const response = await fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: image.name,
          sha: image.sha
        })
      });

      if (response.ok) {
        setImages(images.filter(img => img.name !== image.name));
        alert("Image deleted successfully!");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete image");
      }
    } catch (error) {
      alert("Error deleting image");
    } finally {
      setDeleting(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("Copied to clipboard!");
    }).catch(() => {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert("Copied to clipboard!");
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          <span className="ml-2">Loading images...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Upload Images</h2>
        </div>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleUpload(e.target.files)}
            className="hidden"
          />
          
          {uploading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              <span className="ml-2">Uploading...</span>
            </div>
          ) : (
            <div>
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="text-sm text-gray-600 mb-2">
                Drop images here or{" "}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  browse to upload
                </button>
              </div>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF, WebP, SVG up to 5MB each
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Images Grid */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Images</h2>
            <span className="text-sm text-gray-500">{images.length} images</span>
          </div>
        </div>

        {images.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No images uploaded yet. Upload some images to get started!</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {images.map((image) => (
                <div key={image.sha} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                    <img
                      src={image.downloadUrl}
                      alt={image.name}
                      className="w-full h-32 object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-gray-900 truncate mb-1">
                      {image.name}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2">
                      {formatFileSize(image.size)}
                    </p>
                    
                    <div className="space-y-1">
                      <button
                        onClick={() => copyToClipboard(image.url)}
                        className="w-full text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-left"
                        title="Copy markdown image syntax"
                      >
                        ![Alt]({image.url})
                      </button>
                      <button
                        onClick={() => copyToClipboard(image.url)}
                        className="w-full text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-left"
                        title="Copy URL"
                      >
                        {image.url}
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-center mt-2">
                      <a
                        href={image.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary-600 hover:text-primary-700"
                      >
                        View
                      </a>
                      <button
                        onClick={() => handleDelete(image)}
                        disabled={deleting === image.name}
                        className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        {deleting === image.name ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}