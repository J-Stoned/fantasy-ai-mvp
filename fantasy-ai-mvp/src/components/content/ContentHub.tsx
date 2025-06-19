"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { contentService, ContentArticle, NewsItem, TrendingTopic, ContentCategory } from "@/lib/content-service";
import {
  BookOpen,
  TrendingUp,
  Clock,
  Eye,
  Heart,
  User,
  Tag,
  Search,
  Filter,
  Star,
  Award,
  Zap,
  Target,
  BarChart3,
  Calendar,
  AlertCircle,
  PlayCircle,
  Headphones,
  ExternalLink,
  ThumbsUp,
  MessageCircle,
  Share2,
  Bookmark
} from "lucide-react";

interface ContentHubProps {
  userId: string;
}

type ContentFilter = 'all' | 'expert' | 'news' | 'trending' | 'premium';

export function ContentHub({ userId }: ContentHubProps) {
  const [articles, setArticles] = useState<ContentArticle[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<ContentFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ContentCategory | 'all'>('all');

  useEffect(() => {
    loadContent();
  }, [activeFilter, selectedCategory]);

  const loadContent = async () => {
    setLoading(true);
    try {
      // Load articles based on filter
      let articleOptions: any = { limit: 20 };
      
      if (activeFilter === 'expert') {
        articleOptions.isExpert = true;
      } else if (activeFilter === 'premium') {
        articleOptions.isPremium = true;
      }
      
      if (selectedCategory !== 'all') {
        articleOptions.category = selectedCategory;
      }

      const [articlesData, newsData, trendingData] = await Promise.all([
        contentService.getArticles(articleOptions),
        contentService.getNews({ limit: 10 }),
        contentService.getTrendingTopics()
      ]);

      setArticles(articlesData);
      setNews(newsData);
      setTrendingTopics(trendingData);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadContent();
      return;
    }

    setLoading(true);
    try {
      const results = await contentService.searchContent(searchQuery);
      setArticles(results.articles);
      setNews(results.news);
    } catch (error) {
      console.error('Error searching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeArticle = async (articleId: string) => {
    try {
      await contentService.likeContent(articleId, userId);
      // Update local state
      setArticles(prev => prev.map(article =>
        article.id === articleId
          ? { ...article, likes: article.likes + 1 }
          : article
      ));
    } catch (error) {
      console.error('Error liking article:', error);
    }
  };

  const formatReadTime = (minutes: number) => {
    return `${minutes} min read`;
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const getCategoryIcon = (category: ContentCategory) => {
    switch (category) {
      case ContentCategory.ANALYSIS: return <BarChart3 className="w-4 h-4" />;
      case ContentCategory.NEWS: return <AlertCircle className="w-4 h-4" />;
      case ContentCategory.STRATEGY: return <Target className="w-4 h-4" />;
      case ContentCategory.PICKS: return <Star className="w-4 h-4" />;
      case ContentCategory.TRADE_ADVICE: return <TrendingUp className="w-4 h-4" />;
      case ContentCategory.DRAFT_GUIDE: return <Calendar className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: ContentCategory) => {
    switch (category) {
      case ContentCategory.ANALYSIS: return 'neon-blue';
      case ContentCategory.NEWS: return 'neon-red';
      case ContentCategory.STRATEGY: return 'neon-green';
      case ContentCategory.PICKS: return 'neon-yellow';
      case ContentCategory.TRADE_ADVICE: return 'neon-purple';
      case ContentCategory.DRAFT_GUIDE: return 'neon-gold';
      default: return 'neon-blue';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <GlassCard className="p-6">
              <div className="h-40 bg-white/10 rounded" />
            </GlassCard>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background cyber-grid">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -left-48 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <div className="w-12 h-12 bg-neon-blue/20 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-neon-blue" />
                </div>
                Content Hub
              </h1>
              <p className="text-gray-400">
                Expert analysis, breaking news, and fantasy insights
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-neon-green/20 rounded-full border border-neon-green/30">
                <span className="text-sm text-neon-green font-medium flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Live Updates
                </span>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search articles, news, and analysis..."
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neon-blue/50"
              />
            </div>
            <NeonButton
              variant="blue"
              onClick={handleSearch}
              className="px-6"
            >
              Search
            </NeonButton>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6">
            {[
              { key: 'all', label: 'All Content', icon: BookOpen },
              { key: 'expert', label: 'Expert Analysis', icon: Award },
              { key: 'news', label: 'Breaking News', icon: AlertCircle },
              { key: 'trending', label: 'Trending', icon: TrendingUp },
              { key: 'premium', label: 'Premium', icon: Star }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveFilter(key as ContentFilter)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeFilter === key
                    ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 mb-6">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ContentCategory | 'all')}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-neon-blue/50"
            >
              <option value="all">All Categories</option>
              <option value={ContentCategory.ANALYSIS}>Analysis</option>
              <option value={ContentCategory.NEWS}>News</option>
              <option value={ContentCategory.STRATEGY}>Strategy</option>
              <option value={ContentCategory.PICKS}>Picks</option>
              <option value={ContentCategory.TRADE_ADVICE}>Trade Advice</option>
              <option value={ContentCategory.DRAFT_GUIDE}>Draft Guide</option>
              <option value={ContentCategory.WAIVER_WIRE}>Waiver Wire</option>
            </select>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Featured Article */}
            {articles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <GlassCard className="p-6 hover:border-neon-blue/30 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {articles[0].isPremium && (
                          <div className="px-2 py-1 bg-neon-gold/20 rounded-full border border-neon-gold/30">
                            <span className="text-xs text-neon-gold font-medium flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              Premium
                            </span>
                          </div>
                        )}
                        <div className={`px-2 py-1 bg-${getCategoryColor(articles[0].category)}/20 rounded-full border border-${getCategoryColor(articles[0].category)}/30`}>
                          <span className={`text-xs text-${getCategoryColor(articles[0].category)} font-medium flex items-center gap-1`}>
                            {getCategoryIcon(articles[0].category)}
                            {articles[0].category.replace('_', ' ')}
                          </span>
                        </div>
                        {articles[0].isExpert && (
                          <div className="px-2 py-1 bg-neon-purple/20 rounded-full border border-neon-purple/30">
                            <span className="text-xs text-neon-purple font-medium flex items-center gap-1">
                              <Award className="w-3 h-3" />
                              Expert
                            </span>
                          </div>
                        )}
                      </div>

                      <h2 className="text-2xl font-bold text-white mb-3 hover:text-neon-blue transition-colors cursor-pointer">
                        {articles[0].title}
                      </h2>
                      
                      <p className="text-gray-300 mb-4 line-clamp-3">
                        {articles[0].excerpt}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-neon-blue/20 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-neon-blue" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">{articles[0].author.name}</div>
                              <div className="text-xs text-gray-400">{formatTimeAgo(articles[0].publishedAt)}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-sm text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatReadTime(articles[0].readTime)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {articles[0].views.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleLikeArticle(articles[0].id)}
                            className="flex items-center gap-1 px-3 py-2 bg-white/5 rounded-lg hover:bg-neon-red/20 transition-all group"
                          >
                            <Heart className="w-4 h-4 text-gray-400 group-hover:text-neon-red transition-colors" />
                            <span className="text-sm text-gray-400 group-hover:text-white">
                              {articles[0].likes}
                            </span>
                          </button>
                          
                          <button className="flex items-center gap-1 px-3 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all">
                            <Share2 className="w-4 h-4 text-gray-400" />
                          </button>

                          <button className="flex items-center gap-1 px-3 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all">
                            <Bookmark className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {articles[0].imageUrl && (
                      <div className="w-48 h-32 bg-white/10 rounded-lg flex-shrink-0" />
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* Article Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              <AnimatePresence>
                {articles.slice(1).map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <GlassCard className="p-4 hover:border-neon-blue/30 transition-all duration-300 h-full">
                      <div className="flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-3">
                          {article.isPremium && (
                            <div className="px-2 py-1 bg-neon-gold/20 rounded-full border border-neon-gold/30">
                              <span className="text-xs text-neon-gold font-medium">Premium</span>
                            </div>
                          )}
                          <div className={`px-2 py-1 bg-${getCategoryColor(article.category)}/20 rounded-full border border-${getCategoryColor(article.category)}/30`}>
                            <span className={`text-xs text-${getCategoryColor(article.category)} font-medium`}>
                              {article.category.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-2 hover:text-neon-blue transition-colors cursor-pointer line-clamp-2">
                          {article.title}
                        </h3>

                        <p className="text-gray-400 text-sm mb-3 flex-1 line-clamp-3">
                          {article.excerpt}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-neon-blue/20 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-white">
                                {article.author.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <div className="text-xs text-white font-medium">{article.author.name}</div>
                              <div className="text-xs text-gray-400">{formatTimeAgo(article.publishedAt)}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {article.views > 1000 ? `${(article.views/1000).toFixed(1)}k` : article.views}
                            </span>
                            <button
                              onClick={() => handleLikeArticle(article.id)}
                              className="flex items-center gap-1 hover:text-neon-red transition-colors"
                            >
                              <Heart className="w-3 h-3" />
                              {article.likes}
                            </button>
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending Topics */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-neon-green/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-neon-green" />
                </div>
                <h3 className="text-lg font-bold text-white">Trending</h3>
              </div>

              <div className="space-y-3">
                {trendingTopics.map((topic, index) => (
                  <motion.div
                    key={topic.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 bg-white/5 rounded-lg border border-white/10 hover:border-neon-green/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-white text-sm">{topic.topic}</h4>
                      <div className={`text-xs font-medium ${topic.change > 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                        {topic.change > 0 ? '+' : ''}{topic.change.toFixed(1)}%
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{topic.mentions.toLocaleString()} mentions</span>
                      <span>Score: {topic.score}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>

            {/* Breaking News */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-neon-red/20 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-neon-red" />
                </div>
                <h3 className="text-lg font-bold text-white">Breaking News</h3>
              </div>

              <div className="space-y-3">
                {news.slice(0, 5).map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 bg-white/5 rounded-lg border border-white/10 hover:border-neon-red/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        item.impact === 'HIGH' ? 'bg-neon-red' :
                        item.impact === 'MEDIUM' ? 'bg-yellow-400' : 'bg-neon-green'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-white text-sm mb-1 line-clamp-2">
                          {item.headline}
                        </h4>
                        <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                          {item.summary}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>{item.source}</span>
                          <span>{formatTimeAgo(item.publishedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>

            {/* Quick Actions */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <NeonButton
                  variant="blue"
                  className="w-full flex items-center gap-2 justify-center"
                >
                  <PlayCircle className="w-4 h-4" />
                  Latest Videos
                </NeonButton>
                
                <NeonButton
                  variant="purple"
                  className="w-full flex items-center gap-2 justify-center"
                >
                  <Headphones className="w-4 h-4" />
                  Fantasy Podcasts
                </NeonButton>
                
                <NeonButton
                  variant="green"
                  className="w-full flex items-center gap-2 justify-center"
                >
                  <Star className="w-4 h-4" />
                  Expert Rankings
                </NeonButton>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContentHub;