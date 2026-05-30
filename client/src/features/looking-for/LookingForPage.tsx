import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useAuthStore } from '@/stores/auth';
import type { LookingForPost } from '@crickheroes/shared';

const TYPE_OPTIONS = [
  { value: 'player', label: '🏏 Looking for Player' },
  { value: 'team', label: '👥 Looking for Team' },
  { value: 'opponent', label: '⚔️ Looking for Opponent' },
  { value: 'umpire', label: '🧑‍⚖️ Looking for Umpire' },
  { value: 'ground', label: '🏟️ Looking for Ground' },
];

export function LookingForPage() {
  const { isAuthenticated } = useAuthStore();
  const [posts, setPosts] = useState<LookingForPost[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    type: 'player',
    city: '',
    match_date: '',
    description: '',
  });

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = filter ? { type: filter } : {};
      const { data } = await api.get('/looking-for', { params });
      setPosts(data.data || []);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.description.trim()) return;
    setCreating(true);
    try {
      await api.post('/looking-for', form);
      setShowCreate(false);
      setForm({ type: 'player', city: '', match_date: '', description: '' });
      fetchPosts();
    } catch {
      // handle error
    } finally {
      setCreating(false);
    }
  };

  const typeEmoji = (type: string) => {
    const map: Record<string, string> = { player: '🏏', team: '👥', opponent: '⚔️', umpire: '🧑‍⚖️', ground: '🏟️' };
    return map[type] || '🏏';
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Looking For</h1>
        {isAuthenticated && (
          <Button size="sm" onClick={() => setShowCreate(true)}>+ Post Requirement</Button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilter('')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium ${
            !filter ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              filter === opt.value ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Posts */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="mb-2">No posts found</p>
          {isAuthenticated && <Button variant="outline" onClick={() => setShowCreate(true)}>Post your requirement</Button>}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardContent>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{typeEmoji(post.type)}</span>
                      <Badge variant="info" className="capitalize">{post.type}</Badge>
                      {post.city && <span className="text-sm text-gray-500">📍 {post.city}</span>}
                    </div>
                    <p className="text-gray-700 text-sm">{post.description}</p>
                    {post.match_date && (
                      <p className="text-xs text-gray-400 mt-2">📅 {new Date(post.match_date).toLocaleDateString()}</p>
                    )}
                  </div>
                  <Badge variant={post.status === 'active' ? 'success' : 'default'}>{post.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Post Requirement">
        <div className="space-y-4">
          <Select
            label="Type"
            options={TYPE_OPTIONS}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          />
          <Input
            label="City"
            placeholder="e.g., Mumbai"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
          <Input
            label="Match Date (optional)"
            type="date"
            value={form.match_date}
            onChange={(e) => setForm({ ...form, match_date: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe what you're looking for..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
          <Button className="w-full" loading={creating} onClick={handleCreate} disabled={!form.description.trim()}>
            Post
          </Button>
        </div>
      </Modal>
    </div>
  );
}
