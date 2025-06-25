'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Heart, 
  MessageCircle, 
  Share, 
  Trophy, 
  TrendingUp,
  Users,
  Send,
  Image as ImageIcon,
  MoreHorizontal
} from 'lucide-react';
import { toast } from 'sonner';

interface SocialPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorLevel: number;
  content: string;
  type: 'general' | 'trade_proposal' | 'achievement' | 'prediction' | 'lineup_share';
  metadata?: any;
  likes: number;
  comments: number;
  shares: number;
  hasLiked: boolean;
  createdAt: string;
  tags: string[];
}

interface SocialFeedProps {
  userId: string;
  feedType?: 'global' | 'friends' | 'league';
  leagueId?: string;
}

export function SocialFeed({ userId, feedType = 'global', leagueId }: SocialFeedProps) {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPosts();
  }, [feedType, leagueId]);

  const loadPosts = async (pageNum = 1, append = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '10',
        type: feedType
      });
      
      if (leagueId) {
        params.set('leagueId', leagueId);
      }

      const response = await fetch(`/api/social/feed?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (append) {
          setPosts(prev => [...prev, ...data.posts]);
        } else {
          setPosts(data.posts);
        }
        setHasMore(data.hasMore);
        setPage(pageNum);
      } else {
        toast.error('Failed to load posts');
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      toast.error('Error loading social feed');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadPosts(page + 1, true);
    }
  };

  const createPost = async () => {
    if (!newPost.trim()) return;

    setPosting(true);
    try {
      const response = await fetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newPost,
          type: 'general',
          leagueId: feedType === 'league' ? leagueId : undefined
        })
      });

      if (response.ok) {
        const post = await response.json();
        setPosts(prev => [post, ...prev]);
        setNewPost('');
        toast.success('Post created!');
      } else {
        toast.error('Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Error creating post');
    } finally {
      setPosting(false);
    }
  };

  const likePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/social/posts/${postId}/like`, {
        method: 'POST'
      });

      if (response.ok) {
        const { liked, likesCount } = await response.json();
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, hasLiked: liked, likes: likesCount }
            : post
        ));
      }
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Error updating like');
    }
  };

  const sharePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/social/posts/${postId}/share`, {
        method: 'POST'
      });

      if (response.ok) {
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, shares: post.shares + 1 }
            : post
        ));
        toast.success('Post shared!');
      }
    } catch (error) {
      console.error('Error sharing post:', error);
      toast.error('Error sharing post');
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'trade_proposal': return <Users className="w-4 h-4 text-blue-500" />;
      case 'achievement': return <Trophy className="w-4 h-4 text-yellow-500" />;
      case 'prediction': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'lineup_share': return <Share className="w-4 h-4 text-purple-500" />;
      default: return null;
    }
  };

  const getPostTypeLabel = (type: string) => {
    switch (type) {
      case 'trade_proposal': return 'Trade Proposal';
      case 'achievement': return 'Achievement';
      case 'prediction': return 'Prediction';
      case 'lineup_share': return 'Lineup';
      default: return null;
    }
  };

  const renderPostContent = (post: SocialPost) => {
    switch (post.type) {
      case 'trade_proposal':
        return (
          <div className="space-y-3">
            <p>{post.content}</p>
            {post.metadata && (
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Trade Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Giving:</p>
                    <ul className="text-sm text-blue-600">
                      {post.metadata.giving?.map((player: string, i: number) => (
                        <li key={i}>• {player}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Receiving:</p>
                    <ul className="text-sm text-blue-600">
                      {post.metadata.receiving?.map((player: string, i: number) => (
                        <li key={i}>• {player}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'achievement':
        return (
          <div className="space-y-3">
            <p>{post.content}</p>
            {post.metadata && (
              <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                <div className="flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  <div>
                    <h4 className="font-medium text-yellow-900">
                      {post.metadata.title}
                    </h4>
                    <p className="text-sm text-yellow-700">
                      +{post.metadata.xpReward} XP • +{post.metadata.gemsReward} Gems
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'prediction':
        return (
          <div className="space-y-3">
            <p>{post.content}</p>
            {post.metadata && (
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-green-900">
                      {post.metadata.playerName}
                    </h4>
                    <p className="text-sm text-green-700">
                      Predicted: {post.metadata.prediction} points
                    </p>
                  </div>
                  <Badge className="bg-green-500">
                    {post.metadata.confidence}% confidence
                  </Badge>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return <p>{post.content}</p>;
    }
  };

  return (
    <div className="space-y-4" ref={feedRef}>
      {/* Create Post */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <Textarea
              placeholder="Share your thoughts, predictions, or trade ideas..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="min-h-[100px] resize-none"
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Image
                </Button>
                <Button variant="outline" size="sm">
                  <Users className="w-4 h-4 mr-2" />
                  Trade
                </Button>
                <Button variant="outline" size="sm">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Prediction
                </Button>
              </div>
              <Button 
                onClick={createPost}
                disabled={!newPost.trim() || posting}
              >
                <Send className="w-4 h-4 mr-2" />
                {posting ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={post.authorAvatar} />
                    <AvatarFallback>
                      {post.authorName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{post.authorName}</h3>
                      <Badge variant="outline" className="text-xs">
                        Level {post.authorLevel}
                      </Badge>
                      {post.type !== 'general' && (
                        <div className="flex items-center gap-1">
                          {getPostTypeIcon(post.type)}
                          <span className="text-xs text-gray-600">
                            {getPostTypeLabel(post.type)}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {formatTimeAgo(post.createdAt)}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-3">
                {renderPostContent(post)}
                
                {/* Tags */}
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {post.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-4">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => likePost(post.id)}
                      className={post.hasLiked ? 'text-red-500' : ''}
                    >
                      <Heart className={`w-4 h-4 mr-2 ${post.hasLiked ? 'fill-current' : ''}`} />
                      {post.likes}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      {post.comments}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => sharePost(post.id)}
                    >
                      <Share className="w-4 h-4 mr-2" />
                      {post.shares}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Load More */}
        {hasMore && (
          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={loadMore}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load More Posts'}
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loading && posts.length === 0 && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-300 rounded w-24"></div>
                      <div className="h-3 bg-gray-300 rounded w-16"></div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && posts.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No posts yet
              </h3>
              <p className="text-gray-500">
                Be the first to share something with the community!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}