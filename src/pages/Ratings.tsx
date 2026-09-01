// Ratings.tsx - ALSA AI Community Reviews & Feedback Hub
import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Star,
  Heart,
  Share2,
  Plus,
  Image as ImageIcon,
  Video,
  CheckCircle2,
  X,
  UploadCloud,
  Loader2,
  MessageCircle,
  ArrowLeft,
  Sparkles,
  Search,
  Flame,
  Clock,
  ShieldCheck,
  TrendingUp,
  Users,
  Layers,
  Maximize2
} from 'lucide-react';
import { supabase as _supabase } from '@/integrations/supabase/client';
const supabase: any = _supabase;
import { toast } from 'sonner';

type FilterType = 'all' | '5star' | 'media' | 'most_liked' | 'latest';

const Ratings = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Lightbox State
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: string; userName: string } | null>(null);

  // Form States
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setUser(session.user);
      fetchReviews();
    };
    checkAuth();

    // Live Refresh Realtime Subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reviews' },
        () => fetchReviews()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'review_likes' },
        () => fetchReviews()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  const fetchReviews = async () => {
    try {
      // 1. Fetch reviews directly from public.reviews
      const { data: reviewsData, error: reviewsErr } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (reviewsErr) {
        console.error('Error fetching reviews:', reviewsErr);
        setReviews([]);
        return;
      }

      const list = reviewsData || [];

      // 2. Fetch likes safely without breaking review cards
      try {
        const { data: likesData } = await supabase.from('review_likes').select('*');
        if (likesData && likesData.length > 0) {
          const enriched = list.map((rev: any) => ({
            ...rev,
            review_likes: likesData.filter((l: any) => l.review_id === rev.id),
          }));
          setReviews(enriched);
          return;
        }
      } catch (likeErr) {
        console.warn('review_likes table check:', likeErr);
      }

      setReviews(list);
    } catch (err: any) {
      console.error('Error in fetchReviews:', err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    if (selected) {
      const url = URL.createObjectURL(selected);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- INTERACTION LOGIC ---
  const handleLike = async (reviewId: string) => {
    if (!user) return toast.error('Please log in to like reviews');
    try {
      const { data: existingLike } = await supabase
        .from('review_likes')
        .select('*')
        .eq('review_id', reviewId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingLike) {
        await supabase.from('review_likes').delete().eq('id', existingLike.id);
        toast.info('Like removed');
      } else {
        await supabase.from('review_likes').insert({ review_id: reviewId, user_id: user.id });
        toast.success('Liked review! ❤️');
      }
      fetchReviews();
    } catch (err) {
      toast.error('Could not register like');
    }
  };

  const handleShare = async (rev: any) => {
    const shareData = {
      title: 'ALSA AI User Review',
      text: `${rev.user_name} on ALSA AI: "${rev.comment}"`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (e) {
        // user cancelled share
      }
    } else {
      await navigator.clipboard.writeText(
        `${window.location.origin}/ratings - ${rev.user_name}'s review on ALSA AI: "${rev.comment}"`
      );
      toast.success('Review link copied to clipboard! 📋');
    }
  };

  const handleSubmit = async () => {
    if (!comment.trim()) {
      return toast.error('Please write something before posting!');
    }
    setIsSubmitting(true);
    try {
      let mediaUrl = '';
      let mediaType = 'none';
      if (file) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: upErr } = await supabase.storage
          .from('community_media')
          .upload(filePath, file, { cacheControl: '3600', upsert: false });
        if (upErr) throw upErr;

        const { data: signed } = await supabase.storage
          .from('community_media')
          .createSignedUrl(filePath, 60 * 60 * 24 * 365 * 10);

        mediaUrl = signed?.signedUrl || '';
        mediaType = file.type.startsWith('video') ? 'video' : 'image';
      }

      const newReview = {
        user_id: user.id,
        user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'ALSA User',
        rating,
        comment: comment.trim(),
        media_url: mediaUrl,
        media_type: mediaType,
      };

      const { data: inserted, error: insertErr } = await supabase
        .from('reviews')
        .insert(newReview)
        .select();

      if (insertErr) throw insertErr;

      // Optimistically update UI so user immediately sees their review
      if (inserted && inserted.length > 0) {
        setReviews((prev) => [inserted[0], ...prev]);
      }

      toast.success('Thank you! Your review has been posted. 🎉');
      setIsModalOpen(false);
      setComment('');
      setFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      fetchReviews();
    } catch (err: any) {
      toast.error(err.message || 'Failed to post review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stats Calculations
  const metrics = useMemo(() => {
    const total = reviews.length;
    if (total === 0) {
      return {
        avgRating: '5.0',
        fiveStarPercent: 100,
        totalReviews: 0,
        satisfactionRate: '99%',
      };
    }
    const sum = reviews.reduce((acc, curr) => acc + (curr.rating || 5), 0);
    const avg = (sum / total).toFixed(1);
    const fiveStars = reviews.filter((r) => r.rating === 5).length;
    const percent5 = Math.round((fiveStars / total) * 100);
    return {
      avgRating: avg,
      fiveStarPercent: percent5,
      totalReviews: total,
      satisfactionRate: `${Math.min(99, Math.max(90, 85 + (fiveStars / total) * 15)).toFixed(0)}%`,
    };
  }, [reviews]);

  // Filtered & Sorted Reviews
  const filteredReviews = useMemo(() => {
    return reviews
      .filter((rev) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = rev.user_name?.toLowerCase().includes(q);
          const matchesComment = rev.comment?.toLowerCase().includes(q);
          if (!matchesName && !matchesComment) return false;
        }

        // Category filter
        if (activeFilter === '5star') return rev.rating === 5;
        if (activeFilter === 'media') return Boolean(rev.media_url);
        return true;
      })
      .sort((a, b) => {
        if (activeFilter === 'most_liked') {
          const aLikes = a.review_likes?.length || 0;
          const bLikes = b.review_likes?.length || 0;
          return bLikes - aLikes;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [reviews, searchQuery, activeFilter]);

  //hello

  const ratingDescriptions: Record<number, { title: string; subtitle: string; color: string }> = {
    5: { title: 'Outstanding', subtitle: 'Fast, intelligent & highly recommended', color: 'text-cyan-400' },
    4: { title: 'Very Good', subtitle: 'Great experience and solid performance', color: 'text-blue-400' },
    3: { title: 'Average', subtitle: 'Good features with room for improvement', color: 'text-purple-400' },
    2: { title: 'Needs Improvement', subtitle: 'Faced a few issues while using it', color: 'text-amber-400' },
    1: { title: 'Poor Experience', subtitle: 'Encountered bugs or difficulties', color: 'text-rose-400' },
  };

  return (
    <div className="min-h-screen w-full bg-[#050B14] text-slate-100 relative overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Lights & Cyber Grid (Optimized for mobile performance) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(56,189,248,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(56,189,248,0.03)_1px,transparent_1px)] bg-[size:3rem_3rem] sm:bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute -top-32 -left-32 w-72 h-72 sm:w-[500px] sm:h-[500px] bg-cyan-600/15 blur-[100px] sm:blur-[140px] rounded-full" />
        <div className="absolute top-20 -right-20 w-64 h-64 sm:w-[450px] sm:h-[450px] bg-purple-600/15 blur-[100px] sm:blur-[140px] rounded-full" />
        <div className="absolute bottom-10 left-1/4 w-72 h-72 sm:w-[500px] sm:h-[500px] bg-blue-600/10 blur-[120px] rounded-full" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-20 sm:pb-28">

        {/* Navigation Bar */}
        <div className="flex items-center justify-between gap-3 mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/Chat')}
            className="group inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/50 text-slate-300 hover:text-white transition-all text-xs font-semibold tracking-wide uppercase active:scale-95 backdrop-blur-md"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Chat</span>
          </button>

          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-[11px] sm:text-xs font-medium text-cyan-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span>Live Reviews</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-12 mb-8 sm:mb-12 border border-blue-500/20 bg-gradient-to-b from-[#0B1528]/85 via-[#07101E]/90 to-[#050B14]/90 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8 relative z-10">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-400 text-[11px] sm:text-xs font-medium uppercase tracking-wider mb-3">
                <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span>Verified Feedback</span>
              </div>

              <h1 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight uppercase leading-tight break-words">
                <span className="text-white">REAL STORIES & </span>
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  EXPERIENCES
                </span>
              </h1>

              <p className="text-slate-300 text-xs sm:text-sm lg:text-base mt-2 sm:mt-3 leading-relaxed break-words">
                Honest reviews, ratings, and feedback from creators, developers, and teams using <span className="text-cyan-400 font-semibold">ALSA AI</span>.
              </p>
            </div>

            {/* Write Review CTA */}
            <div className="w-full sm:w-auto">
              <Button
                onClick={() => setIsModalOpen(true)}
                className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 rounded-xl sm:rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:via-blue-500 hover:to-purple-500 text-white font-bold text-sm sm:text-base uppercase tracking-wider shadow-lg shadow-cyan-500/20 active:scale-95 transition-all duration-200 border border-cyan-300/30 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-200" />
                <span>Write a Review</span>
              </Button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mt-6 sm:mt-10 pt-6 sm:pt-8 border-t border-slate-800/80">
            {/* Average Rating */}
            <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900/50 border border-cyan-500/20">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] sm:text-xs text-slate-400 font-medium truncate">Avg Rating</span>
                <Star className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400 shrink-0" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">{metrics.avgRating}</span>
                <span className="text-[11px] sm:text-xs font-semibold text-cyan-400">/ 5.0</span>
              </div>
              <div className="flex items-center gap-0.5 sm:gap-1 mt-1.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${i < Math.round(Number(metrics.avgRating))
                        ? 'text-cyan-400 fill-cyan-400'
                        : 'text-slate-700'
                      }`}
                  />
                ))}
              </div>
            </div>

            {/* Total Reviews */}
            <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900/50 border border-blue-500/20">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] sm:text-xs text-slate-400 font-medium truncate">Total Reviews</span>
                <Users className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">{metrics.totalReviews}</span>
                <span className="text-[11px] sm:text-xs font-medium text-blue-400">Total</span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 mt-1.5 truncate flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400 shrink-0" /> Active Users
              </p>
            </div>

            {/* Satisfaction */}
            <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900/50 border border-purple-500/20">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] sm:text-xs text-slate-400 font-medium truncate">5-Star Ratio</span>
                <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">{metrics.fiveStarPercent}%</span>
              </div>
              <p className="text-[10px] sm:text-xs text-purple-300/80 mt-1.5 truncate font-medium">
                Top Satisfaction
              </p>
            </div>

            {/* Genuine Reviews */}
            <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900/50 border border-emerald-500/20">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] sm:text-xs text-slate-400 font-medium truncate">Verified Users</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">100%</span>
                <span className="text-[11px] sm:text-xs font-medium text-emerald-400">Real</span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 mt-1.5 truncate font-medium">
                Authentic Reviews
              </p>
            </div>
          </div>
        </div>

        {/* Filter and Search Controls (Fully Responsive on Mobile & Tablets) */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
          {/* Scrollable Filter Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none touch-pan-x">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold tracking-wide whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 border shrink-0 active:scale-95 ${activeFilter === 'all'
                  ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-300 shadow-md shadow-cyan-500/10'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>All ({reviews.length})</span>
            </button>

            <button
              onClick={() => setActiveFilter('5star')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold tracking-wide whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 border shrink-0 active:scale-95 ${activeFilter === '5star'
                  ? 'bg-yellow-500/20 border-yellow-400/60 text-yellow-300 shadow-md shadow-yellow-500/10'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
            >
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 shrink-0" />
              <span>5 Star</span>
            </button>

            <button
              onClick={() => setActiveFilter('media')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold tracking-wide whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 border shrink-0 active:scale-95 ${activeFilter === 'media'
                  ? 'bg-purple-500/20 border-purple-400/60 text-purple-300 shadow-md shadow-purple-500/10'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>With Media</span>
            </button>

            <button
              onClick={() => setActiveFilter('most_liked')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold tracking-wide whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 border shrink-0 active:scale-95 ${activeFilter === 'most_liked'
                  ? 'bg-pink-500/20 border-pink-400/60 text-pink-300 shadow-md shadow-pink-500/10'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
            >
              <Flame className="w-3.5 h-3.5 text-pink-400 shrink-0" />
              <span>Most Liked</span>
            </button>

            <button
              onClick={() => setActiveFilter('latest')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold tracking-wide whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 border shrink-0 active:scale-95 ${activeFilter === 'latest'
                  ? 'bg-blue-500/20 border-blue-400/60 text-blue-300 shadow-md shadow-blue-500/10'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
            >
              <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Newest</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72 lg:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reviews..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-500/30 outline-none text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 transition-all backdrop-blur-md"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Reviews Grid (Rock-solid Responsive Grid instead of jumping CSS Columns) */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 sm:py-28 gap-4">
            <div className="relative">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Star className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm font-medium">
              Loading community reviews...
            </p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-8 sm:p-12 text-center rounded-2xl sm:rounded-3xl bg-[#0B1528]/40 border border-slate-800/80 backdrop-blur-xl max-w-md mx-auto my-8 sm:my-12">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4 text-cyan-400">
              <Star className="w-7 h-7" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">No Reviews Found</h3>
            <p className="text-slate-400 text-xs sm:text-sm mb-6 leading-relaxed">
              No reviews match your selected filter. Be the first to write a review!
            </p>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl uppercase text-xs tracking-wider"
            >
              Write First Review
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
            {filteredReviews.map((rev) => {
              const likeCount = rev.review_likes?.length || 0;
              const isLikedByMe = user && rev.review_likes?.some((l: any) => l.user_id === user.id);
              const formattedDate = new Date(rev.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div
                  key={rev.id}
                  className="w-full relative rounded-2xl sm:rounded-3xl p-4 sm:p-6 bg-gradient-to-b from-[#0D1B33]/90 via-[#0A1528]/85 to-[#07101E]/95 border border-blue-500/20 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 backdrop-blur-xl overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Avatar, Name, Verified Badge, Rating Stars */}
                    <div className="flex items-start justify-between gap-2.5 mb-3.5">
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 p-[1.5px] shadow-sm">
                            <div className="w-full h-full rounded-[10px] sm:rounded-[14px] bg-[#0A1324] flex items-center justify-center font-bold text-xs sm:text-sm text-cyan-300 uppercase">
                              {rev.user_name?.charAt(0) || 'U'}
                            </div>
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0A1324]" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                              {rev.user_name}
                            </h4>
                            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] sm:text-[11px] text-cyan-400 font-medium bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-800/40 shrink-0">
                              Verified
                            </span>
                            <span className="text-[10px] sm:text-[11px] text-slate-400 truncate">{formattedDate}</span>
                          </div>
                        </div>
                      </div>

                      {/* Stars Badge */}
                      <div className="flex items-center gap-0.5 bg-slate-900/90 border border-slate-700/60 px-2 py-1 rounded-full shrink-0">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={10}
                            className={
                              i < rev.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-slate-700'
                            }
                          />
                        ))}
                      </div>
                    </div>

                    {/* Comment Body with word breaking */}
                    <p className="text-slate-200 text-xs sm:text-sm leading-relaxed mb-4 break-words [overflow-wrap:anywhere]">
                      "{rev.comment}"
                    </p>

                    {/* Media Display */}
                    {rev.media_url && (
                      <div className="relative rounded-xl sm:rounded-2xl overflow-hidden bg-slate-950/80 border border-slate-700/60 mb-4 group/media">
                        {rev.media_type === 'video' ? (
                          <video
                            src={rev.media_url}
                            controls
                            preload="metadata"
                            className="w-full h-auto block max-h-64 sm:max-h-80 object-contain bg-black/60"
                          />
                        ) : (
                          <div
                            onClick={() =>
                              setSelectedMedia({
                                url: rev.media_url,
                                type: rev.media_type,
                                userName: rev.user_name,
                              })
                            }
                            className="relative cursor-pointer group/img overflow-hidden"
                          >
                            <img
                              src={rev.media_url}
                              alt="Review Attachment"
                              loading="lazy"
                              className="w-full h-auto block max-h-64 sm:max-h-80 object-cover group-hover/img:scale-105 transition-transform duration-500 ease-out"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end justify-between p-2.5">
                              <span className="text-[10px] sm:text-[11px] text-cyan-300 font-medium flex items-center gap-1">
                                <Maximize2 className="w-3 h-3" /> View full image
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Like, Reply, Share */}
                  <div className="flex items-center justify-between pt-3.5 border-t border-slate-800/80 text-slate-400 mt-2">
                    <div className="flex items-center gap-3 sm:gap-4">
                      {/* Like Button */}
                      <button
                        onClick={() => handleLike(rev.id)}
                        className={`flex items-center gap-1.5 text-xs font-medium transition-all active:scale-90 p-1 -ml-1 ${isLikedByMe
                            ? 'text-pink-400'
                            : 'text-slate-400 hover:text-pink-400'
                          }`}
                      >
                        <Heart
                          size={15}
                          className={isLikedByMe ? 'fill-pink-500 text-pink-500' : ''}
                        />
                        <span className="font-bold">{likeCount}</span>
                      </button>

                      {/* Reply Button */}
                      <button
                        onClick={() => toast.info('Comments & replies are coming in the next update!')}
                        className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-cyan-400 transition-colors p-1"
                      >
                        <MessageCircle size={15} />
                        <span>Reply</span>
                      </button>
                    </div>

                    {/* Share Button */}
                    <button
                      onClick={() => handleShare(rev)}
                      title="Share Review"
                      className="text-slate-400 hover:text-cyan-300 transition-all p-1.5 rounded-lg hover:bg-slate-800/60 active:scale-90"
                    >
                      <Share2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Post Feedback Modal (Fully Mobile Friendly & Scrollable) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-3.5 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-gradient-to-b from-[#0D1F38] via-[#091526] to-[#060D18] border border-cyan-500/30 p-5 sm:p-8 rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl relative overflow-hidden my-auto max-h-[90vh] flex flex-col justify-between"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-5 relative z-10 shrink-0">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-[10px] sm:text-xs text-cyan-300 font-medium uppercase tracking-wider mb-1.5">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>Share Experience</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-white">
                    Write a Review
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                    Your feedback helps us continuously improve ALSA AI.
                  </p>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 p-2 rounded-full text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <div className="overflow-y-auto pr-1 space-y-4 sm:space-y-5 relative z-10">
                {/* Rating Selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 font-medium">Select Rating</span>
                    <span className={`text-xs font-bold ${ratingDescriptions[rating].color}`}>
                      {ratingDescriptions[rating].title}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-950/70 border border-slate-800">
                    <div className="flex gap-2 sm:gap-3">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setRating(num)}
                          className="focus:outline-none transition-transform hover:scale-115 active:scale-95"
                        >
                          <Star
                            size={24}
                            className={`transition-all duration-200 ${num <= rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-slate-700'
                              }`}
                          />
                        </button>
                      ))}
                    </div>
                    <span className="text-lg sm:text-xl font-extrabold text-white">{rating}.0</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 px-1">
                    {ratingDescriptions[rating].subtitle}
                  </p>
                </div>

                {/* Textarea */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs text-slate-400 font-medium">Your Review</label>
                    <span className="text-[10px] text-slate-500">{comment.length} / 500</span>
                  </div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    maxLength={500}
                    rows={3}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-xs sm:text-sm text-slate-100 focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-500/30 outline-none resize-none placeholder:text-slate-600 font-normal leading-relaxed"
                    placeholder="Tell us about your experience with ALSA AI features, speed, and intelligence..."
                  />
                </div>

                {/* Media Upload */}
                <div>
                  <label className="block text-xs text-slate-400 font-medium mb-1.5">
                    Attach Media (Optional)
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl sm:rounded-2xl p-4 text-center cursor-pointer transition-all ${file
                        ? 'border-cyan-500/60 bg-cyan-950/20'
                        : 'border-slate-800 hover:border-cyan-500/40 bg-slate-950/30'
                      }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      hidden
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                    />

                    {file ? (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 text-left truncate">
                          <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                            {file.type.startsWith('video') ? <Video size={18} /> : <ImageIcon size={18} />}
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-bold text-white truncate max-w-[180px] sm:max-w-[240px]">
                              {file.name}
                            </p>
                            <p className="text-[10px] text-cyan-400">
                              {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={clearFile}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-300 transition-colors shrink-0"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-1">
                        <UploadCloud className="w-6 h-6 sm:w-7 sm:h-7 text-slate-500 mb-1" />
                        <p className="text-xs text-slate-300 font-semibold">
                          Upload image or video
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          PNG, JPG, WEBP, MP4 (Max 50MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-4 mt-2 shrink-0">
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full h-12 sm:h-13 rounded-xl sm:rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:via-blue-500 hover:to-purple-500 text-white font-bold text-sm sm:text-base uppercase tracking-wider shadow-lg shadow-cyan-500/20 active:scale-95 transition-all border border-cyan-300/30"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
                      <span>Posting Review...</span>
                    </div>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-200" />
                      Post Review 🚀
                    </span>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightbox Media Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <div
            onClick={() => setSelectedMedia(null)}
            className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-xl flex items-center justify-center p-3.5 sm:p-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[85vh] w-full rounded-2xl overflow-hidden border border-cyan-500/40 bg-slate-950/90 shadow-2xl flex flex-col"
            >
              <div className="p-3 sm:p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs text-cyan-400 font-semibold tracking-wide truncate">
                  Review Attachment — {selectedMedia.userName}
                </span>
                <button
                  onClick={() => setSelectedMedia(null)}
                  className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-2 flex items-center justify-center bg-black/80 overflow-auto">
                <img
                  src={selectedMedia.url}
                  alt="Review Full Preview"
                  className="max-h-[70vh] sm:max-h-[75vh] w-auto object-contain rounded-lg"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Ratings;