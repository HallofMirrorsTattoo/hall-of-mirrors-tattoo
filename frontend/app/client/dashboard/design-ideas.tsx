'use client';

import { useEffect, useRef, useState } from 'react';
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
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/client/design-ideas`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
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

    if (accessToken) fetchIdeas();
  }, [accessToken]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setUploadError('');
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please choose an image first');
      return;
    }

    setUploading(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      if (description) formData.append('description', description);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/client/design-ideas`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
          body: formData,
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Upload failed');
      }

      const data = await response.json();
      setIdeas([data.design_idea, ...ideas]);
      setSelectedFile(null);
      setPreview(null);
      setDescription('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this design idea?')) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/client/design-ideas/${id}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!response.ok) throw new Error('Failed to delete');
      setIdeas(ideas.filter(idea => idea.design_idea_id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  if (loading) return (
    <div style={{ padding: '3rem 0', textAlign: 'center' }}>
      <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text-low)' }}>Loading...</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Upload form */}
      <div className="card-premium">
        <div className="card-premium-inner">
          <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.25rem', fontWeight: 400, color: 'var(--cream)', marginBottom: '1.5rem' }}>
            Add Design Reference
          </h3>
          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Drop zone / file picker */}
            <div>
              <label htmlFor="design-image">Image</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '1px dashed var(--border)',
                  borderRadius: '0.5rem',
                  padding: '2rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s ease',
                  backgroundColor: 'var(--surface)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.35)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                {preview ? (
                  <div style={{ position: 'relative', width: '100%', height: '10rem', marginBottom: '0.75rem' }}>
                    <Image src={preview} alt="Preview" fill style={{ objectFit: 'contain', borderRadius: '0.25rem' }} />
                  </div>
                ) : (
                  <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-low)', marginBottom: '0.5rem' }}>
                    Click to choose a photo
                  </p>
                )}
                <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.1em', color: 'var(--text-low)' }}>
                  {selectedFile ? selectedFile.name : 'JPG, PNG, WEBP — max 10 MB'}
                </p>
              </div>
              <input
                ref={fileInputRef}
                id="design-image"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>

            <div>
              <label htmlFor="design-description">Description (optional)</label>
              <textarea
                id="design-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell Robyn what you like about this design..."
                rows={3}
              />
            </div>

            {uploadError && (
              <div className="alert-error">{uploadError}</div>
            )}

            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="btn-primary"
              style={{ opacity: uploading || !selectedFile ? 0.5 : 1, cursor: !selectedFile ? 'not-allowed' : 'pointer' }}
            >
              {uploading ? 'Uploading...' : 'Add Design Reference'}
            </button>
          </form>
        </div>
      </div>

      {/* Gallery */}
      {error && <div className="alert-error">{error}</div>}

      {ideas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <p style={{ color: 'var(--text-mid)', fontFamily: '"DM Sans", sans-serif', fontSize: '0.9rem' }}>
            No design references yet. Upload a photo to share with Robyn.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(14rem, 1fr))', gap: '1.25rem' }}>
          {ideas.map((idea) => (
            <div key={idea.design_idea_id} className="card-premium">
              <div className="card-premium-inner" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ position: 'relative', width: '100%', height: '10rem', backgroundColor: 'var(--surface-2)' }}>
                  <Image src={idea.image_url} alt="Design idea" fill style={{ objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '0.875rem 1rem' }}>
                  {idea.description && (
                    <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: 'var(--text)', marginBottom: '0.5rem', lineHeight: 1.5 }}>
                      {idea.description}
                    </p>
                  )}
                  <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.1em', color: 'var(--text-low)', marginBottom: '0.875rem' }}>
                    {new Date(idea.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <button onClick={() => handleDelete(idea.design_idea_id)} className="btn-secondary" style={{ width: '100%', fontSize: '0.8125rem', padding: '0.5rem 0' }}>
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
