// Ratings.tsx - Updated Full Logic
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Star, Heart, Share2, Plus, Image as ImageIcon, Video, CheckCircle2, X, UploadCloud, Loader2, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

const Ratings = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [user, setUser] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form States
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/auth'); return; }
      setUser(session.user);
      fetchReviews();
    };
    checkAuth();

    // Live Refresh
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => fetchReviews())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [navigate]);

  const fetchReviews = async () => {
    // Yahan hum likes ka count bhi laa rahe hain
    const { data, error } = await supabase
      .from('reviews')
      .select('*, review_likes(count)')
      .order('created_at', { ascending: false });
    
    if (error) console.error(error);
    else setReviews(data || []);
    setLoading(false);
  };

  // --- INTERACTION LOGIC ---

  const handleLike = async (reviewId: string) => {
    try {
      const { data: existingLike } = await supabase
        .from('review_likes')
        .select('*')
        .eq('review_id', reviewId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingLike) {
        await supabase.from('review_likes').delete().eq('id', existingLike.id);
      } else {
        await supabase.from('review_likes').insert({ review_id: reviewId, user_id: user.id });
        toast.success("Liked! ❤️");
      }
      fetchReviews();
    } catch (err) { toast.error("Like failed"); }
  };

  const handleShare = async (rev: any) => {
    const shareData = {
      title: 'ALSA AI Experience',
      text: `${rev.user_name} says: ${rev.comment}`,
      url: window.location.href,
    };
    if (navigator.share) await navigator.share(shareData);
    else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied!");
    }
  };

  const handleSubmit = async () => {
    if (!comment) return toast.error("Kuch likho bhai!");
    setIsSubmitting(true);
    try {
      let mediaUrl = "";
      let mediaType = "none";
      if (file) {
        const filePath = `${user.id}/${Math.random()}.${file.name.split('.').pop()}`;
        const { error: upErr } = await supabase.storage.from('community_media').upload(filePath, file);
        if (upErr) throw upErr;
        mediaUrl = supabase.storage.from('community_media').getPublicUrl(filePath).data.publicUrl;
        mediaType = file.type.startsWith('video') ? 'video' : 'image';
      }
      await supabase.from('reviews').insert({
        user_id: user.id, user_name: user.email?.split('@')[0],
        rating, comment, media_url: mediaUrl, media_type: mediaType
      });
      setIsModalOpen(false); setComment(""); setFile(null);
    } catch (err: any) { toast.error(err.message); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-[#0A1A2F] text-white pt-24 pb-20 px-4">
      <div className="container mx-auto max-w-6xl">
        
        {/* Header Section */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col md:flex-row justify-between items-center gap-8 mb-16"
        >
          <div>
            <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              ALSA AI Feedback CIRCLE
            </h1>
            <p className="text-white/40 mt-2 font-medium tracking-widest uppercase text-[10px] md:text-xs">
              Live Community Feed & Verified Experiences
            </p>
          </div>
          
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white h-16 px-10 rounded-2xl font-black text-lg shadow-[0_0_40px_rgba(37,99,235,0.2)] active:scale-95 transition-all"
          >
            <Plus className="mr-2 h-6 w-6" /> POST REVIEW
          </Button>
        </motion.div>

        {/* Reviews Masonry Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-blue-500 h-12 w-12" />
            <p className="text-white/20 font-mono animate-pulse">Fetching community vibes...</p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            <AnimatePresence mode="popLayout">
              {reviews.map((rev) => (
                <motion.div
                  key={rev.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="break-inside-avoid"
                >
                  <Card className="bg-[#112240]/40 border-white/5 backdrop-blur-xl rounded-[2.5rem] overflow-hidden group hover:border-blue-500/30 transition-all duration-500 shadow-2xl">
                    <div className="p-6">
                      {/* User Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center font-bold text-xs border border-white/10 shadow-inner">
                            {rev.user_name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold flex items-center gap-1">
                              {rev.user_name} <CheckCircle2 size={14} className="text-blue-400" />
                            </h4>
                            <p className="text-[9px] text-white/40 uppercase font-black tracking-tighter">Verified Member</p>
                          </div>
                        </div>
                        <div className="flex gap-0.5 bg-white/5 px-2 py-1 rounded-full">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={10} className={i < rev.rating ? "fill-yellow-500 text-yellow-500" : "text-white/10"} />
                          ))}
                        </div>
                      </div>

                      {/* Comment Text */}
                      <p className="text-white/80 text-sm leading-relaxed mb-4 font-medium italic selection:bg-blue-500/30">
                        "{rev.comment}"
                      </p>

                      {/* Real-Size Media Handling */}
                      {rev.media_url && (
                        <div className="relative rounded-2xl overflow-hidden bg-black/20 border border-white/5 mb-4 group-hover:border-white/20 transition-colors">
                          {rev.media_type === 'video' ? (
                            <video src={rev.media_url} controls className="w-full h-auto block max-h-[500px] object-contain" />
                          ) : (
                            <img src={rev.media_url} alt="Review" className="w-full h-auto block group-hover:scale-[1.02] transition-transform duration-700" />
                          )}
                        </div>
                      )}

                      {/* Interaction Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex gap-6">
                          {/* Like Button */}
                          <button 
                            onClick={() => handleLike(rev.id)}
                            className="flex items-center gap-1.5 group transition-colors hover:text-pink-500"
                          >
                            <Heart 
                              size={18} 
                              className={rev.review_likes?.[0]?.count > 0 ? "fill-pink-500 text-pink-500" : "text-white/30"} 
                            />
                            <span className="text-[10px] font-bold text-white/40 group-hover:text-pink-500 tracking-tighter">
                              {rev.review_likes?.[0]?.count || 0} LIKES
                            </span>
                          </button>

                          {/* Reply Button */}
                          <button 
                            onClick={() => toast.info("Comments feature coming soon!")}
                            className="flex items-center gap-1.5 group transition-colors hover:text-blue-400 text-white/30"
                          >
                            <MessageCircle size={18} />
                            <span className="text-[10px] font-bold group-hover:text-blue-400 tracking-tighter">REPLY</span>
                          </button>
                        </div>

                        {/* Share Button */}
                        <button 
                          onClick={() => handleShare(rev)}
                          className="text-white/30 hover:text-white transition-all active:scale-90 p-1"
                        >
                          <Share2 size={18} />
                        </button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Upload Modal (AnimatePresence se smooth entry) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ y: 100, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-[#0D1F35] border border-white/10 p-8 rounded-[3.5rem] max-w-lg w-full shadow-2xl relative overflow-hidden"
            >
              {/* Modal Background Glow */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-600/10 blur-[80px] rounded-full pointer-events-none"></div>

              <div className="flex justify-between items-center mb-8 relative z-10">
                <h3 className="text-3xl font-black italic tracking-tighter">POST FEEDBACK</h3>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="bg-white/5 p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              {/* Star Rating Slider */}
              <div className="flex flex-col items-center gap-2 mb-8 relative z-10">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Select Rating</span>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map((num) => (
                    <Star 
                      key={num} size={36} 
                      className={`cursor-pointer transition-all duration-300 ${num <= rating ? 'text-yellow-500 fill-yellow-500 scale-110 drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]' : 'text-white/10'}`}
                      onClick={() => setRating(num)}
                    />
                  ))}
                </div>
              </div>

              <textarea 
                value={comment} 
                onChange={(e) => setComment(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-6 text-sm mb-6 focus:ring-2 ring-blue-500/50 outline-none h-32 resize-none placeholder:text-white/10 font-medium" 
                placeholder="How's your experience with ALSA AI? Control, Coding or Automation..."
              />

              {/* Advanced Media Upload Area */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/10 rounded-[2.5rem] p-10 text-center mb-8 cursor-pointer hover:bg-white/5 hover:border-blue-500/40 transition-all group relative overflow-hidden"
              >
                <input type="file" ref={fileInputRef} hidden accept="image/*,video/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                {file ? (
                  <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-2 text-blue-400 font-bold">
                    <div className="bg-blue-500/20 p-4 rounded-2xl mb-2">
                      {file.type.startsWith('video') ? <Video size={30}/> : <ImageIcon size={30}/>}
                    </div>
                    <span className="truncate max-w-[200px] text-xs uppercase tracking-widest">{file.name}</span>
                    <span className="text-[10px] text-white/20">Click to change file</span>
                  </motion.div>
                ) : (
                  <>
                    <UploadCloud className="mx-auto mb-3 text-white/10 group-hover:text-blue-500 group-hover:scale-110 transition-all duration-500" size={48} />
                    <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em] group-hover:text-white transition-colors">Attach Media (Proof)</p>
                  </>
                )}
              </div>

              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 py-8 rounded-[2rem] font-black text-xl shadow-2xl shadow-blue-500/30 active:scale-95 transition-all"
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : "Launch It Now 🚀"}
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Ratings;