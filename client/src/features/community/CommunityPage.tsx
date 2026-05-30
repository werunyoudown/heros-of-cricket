import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/auth';

interface Post {
  id: string;
  author_id: string;
  content: string;
  media_urls: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
  author?: { full_name: string; avatar_url: string | null };
}

export function CommunityPage() {
  const { isAuthenticated, profile } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/community/posts');
      setPosts(data.data || []);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    if (!newPost.trim()) return;
    setPosting(true);
    try {
      await api.post('/community/posts', { content: newPost });
      setNewPost('');
      fetchPosts();
    } catch {
      // handle error
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await api.post(`/community/posts/${postId}/like`);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p))
      );
    } catch {
      // already liked or error
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Community</h1>

      {/* Create Post */}
      {isAuthenticated && (
        <Card className="mb-6">
          <CardContent>
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary-600 text-sm font-medium">
                  {profile?.full_name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="Share your cricket moment..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
                <div className="flex justify-end mt-2">
                  <Button size="sm" loading={posting} onClick={handlePost} disabled={!newPost.trim()}>
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feed */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading feed...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="mb-2">No posts yet</p>
          <p className="text-sm">Be the first to share something!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardContent>
                <div className="flex gap-3">
                  <Link to={`/profile/${post.author_id}`}>
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      {post.author?.avatar_url ? (
                        <img src={post.author.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <span className="text-gray-600 text-sm font-medium">
                          {post.author?.full_name?.charAt(0) || 'U'}
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link to={`/profile/${post.author_id}`} className="font-medium text-gray-900 hover:text-primary-600">
                        {post.author?.full_name || 'User'}
                      </Link>
                      <span className="text-xs text-gray-400">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm mt-1 whitespace-pre-wrap">{post.content}</p>
                    {post.media_urls?.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {post.media_urls.map((url, i) => (
                          <img key={i} src={url} alt="" className="rounded-lg w-full h-40 object-cover" />
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-3 pt-2 border-t border-gray-50">
                      <button
                        onClick={() => handleLike(post.id)}
                        className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1"
                      >
                        ❤️ {post.likes_count}
                      </button>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        💬 {post.comments_count}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
