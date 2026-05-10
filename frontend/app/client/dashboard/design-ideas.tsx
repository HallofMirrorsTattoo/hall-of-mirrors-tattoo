'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useClientAuth } from '@/lib/clientAuthContext';

interface DesignIdea {
  design_idea_id: string;
  image_url: string;
  description: string;
  created_at: string;
}

export default function DesignIdeasTab() {
  const { accessToken } = useClientAuth();
  const [ideas, setIdeas] = useState<DesignIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/client/design-ideas`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) throw new Error('Failed to fetch design ideas');

        const data = await response.json();
        setIdeas(data.design_ideas || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load design ideas');
      } finally {
        setLoading(false);
      }
    };

    if (accessToken) {
      fetchIdeas();
    }
  }, [accessToken]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      alert('Please provide an image URL');
      return;
    }

    setUploading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/client/design-ideas`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            image_url: imageUrl,
            description: description || null,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to upload design idea');

      const data = await response.json();
      setIdeas([data.design_idea, ...ideas]);
      setImageUrl('');
      setDescription('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this design idea?')) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/client/design-ideas/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to delete design idea');

      setIdeas(ideas.filter(idea => idea.design_idea_id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  if (loading) return <p>Loading your design ideas...</p>;

  return (
    <div className="space-y-8">
      {/* Upload Form */}
      <div className="card-premium">
        <div className="card-premium-inner">
          <h3 className="text-lg font-serif font-bold text-primary-dark mb-6">
            Add Design Reference
          </h3>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary-dark/80 mb-2">Image URL</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full bg-white border border-primary-dark/10 rounded-lg px-4 py-3 text-primary-dark focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold/30"
              />
              <p className="text-xs text-primary-dark/60 mt-2">
                Paste the URL of an image you'd like to share with Robyn
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-dark/80 mb-2">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell Robyn what you like about this design..."
                rows={3}
                className="w-full bg-white border border-primary-dark/10 rounded-lg px-4 py-3 text-primary-dark focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold/30"
              />
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Adding...' : 'Add Design Reference'}
            </button>
          </form>
        </div>
      </div>

      {/* Design Ideas Gallery */}
      {error && <p className="text-red-600">{error}</p>}

      {ideas.length === 0 ? (
        <div className="text-center py-12 text-primary-dark/70">
          <p>No design ideas yet. Start by adding reference images!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {ideas.map((idea) => (
            <div key={idea.design_idea_id} className="card-premium">
              <div className="card-premium-inner p-0 overflow-hidden">
                <div className="relative w-full h-48 bg-primary-dark/10">
                  <Image
                    src={idea.image_url}
                    alt="Design idea"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  {idea.description && (
                    <p className="text-sm text-primary-dark/70 mb-3">{idea.description}</p>
                  )}
                  <p className="text-xs text-primary-dark/50 mb-4">
                    {new Date(idea.created_at).toLocaleDateString()}
                  </p>
                  <button
                    onClick={() => handleDelete(idea.design_idea_id)}
                    className="w-full btn-secondary text-sm py-2"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
