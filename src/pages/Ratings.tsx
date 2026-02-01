import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Heart, Share2, Plus, Image as ImageIcon, Video, CheckCircle2, X, UploadCloud, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

const Ratings = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // States
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
      if (!session) {
        toast.error("Bhai, pehle login karle!");
        navigate('/auth');
        return;
      }
      setUser(session.user);
      fetchReviews();
    };

    checkAuth();

    // Real-time Updates: Naye reviews apne aap dikhenge
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reviews' }, 
      (payload) => {
        setReviews((prev) => [payload.new, ...prev]);
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [navigate]);

  const fetchReviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) toast.error("Data nahi aa raha: " + error.message);
    else setReviews(data || []);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!comment) return toast.error("Kuch toh likh bhai!");
    setIsSubmitting(true);

    try {
      let mediaUrl = "";
      let mediaType = "none";

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('community_media')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('community_media').getPublicUrl(filePath);
        mediaUrl = data.publicUrl;
        mediaType = file.type.startsWith('video') ? 'video' : 'image';
      }

      const { error: dbError } = await supabase.from('reviews').insert({
        user_id: user.id,
        user_name: user.user_metadata?.full_name || user.email?.split('@')[0],
        rating,
        comment,
        media_url: mediaUrl,
        media_type: mediaType
      });

      if (dbError) throw dbError;

      toast.success("Review live ho gaya! 🔥");
      setIsModalOpen(false);
      setComment("");
      setFile(null);
      setRating(5);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A1A2F] text-white pt-24 pb-20 px-4">
      <div className="container mx-auto max-w-6xl">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-16">
          <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
            <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              ALSA CIRCLE
            </h1>
            <p className="text-white/40 mt-2 font-medium tracking-widest uppercase text-xs">Verified User Feedback & Showcases</p>
          </motion.div>
          
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white h-16 px-10 rounded-2xl font-black text-lg shadow-[0_0_40px_rgba(37,99,235,0.2)] active:scale-95 transition-all"
          >
            <Plus className="mr-2 h-6 w-6" /> POST EXPERIENCE
          </Button>
        </div>

        {/* Reviews Feed */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500 h-12 w-12" /></div>
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
                  <Card className="bg-[#112240]/40 border-white/5 backdrop-blur-xl rounded-[2rem] overflow-hidden group hover:border-blue-500/30 transition-all duration-500">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center font-bold text-xs border border-white/10">
                            {rev.user_name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold flex items-center gap-1">{rev.user_name} <CheckCircle2 size={14} className="text-blue-400" /></h4>
                            <p className="text-[9px] text-white/40 uppercase font-black">Verified Member</p>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={10} className={i < rev.rating ? "fill-yellow-500 text-yellow-500" : "text-white/10"} />
                          ))}
                        </div>
                      </div>

                      <p className="text-white/80 text-sm leading-relaxed mb-4 font-medium italic">"{rev.comment}"</p>

                      {/* Real Size Media Display */}
                      {rev.media_url && (
                        <div className="relative rounded-2xl overflow-hidden bg-black/20 border border-white/5 mb-4 group-hover:border-white/20 transition-colors">
                          {rev.media_type === 'video' ? (
                            <video src={rev.media_url} controls className="w-full h-auto block" />
                          ) : (
                            <img src={rev.media_url} alt="Review" className="w-full h-auto block group-hover:scale-[1.02] transition-transform duration-700" />
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex gap-4">
                          <button className="flex items-center gap-1.5 text-white/30 hover:text-pink-500 transition-colors">
                            <Heart size={16} /> <span className="text-[10px] font-bold">LIT</span>
                          </button>
                          <button className="flex items-center gap-1.5 text-white/30 hover:text-blue-400 transition-colors">
                            <Share2 size={16} /> <span className="text-[10px] font-bold">SHARE</span>
                          </button>
                        </div>
                        <span className="text-[9px] text-white/20 font-mono italic">{new Date(rev.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div 
            initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="bg-[#0D1F35] border border-white/10 p-8 rounded-[3rem] max-w-lg w-full shadow-2xl"
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-3xl font-black italic">POST FEEDBACK</h3>
              <button onClick={() => setIsModalOpen(false)} className="bg-white/5 p-2 rounded-full hover:bg-white/10"><X /></button>
            </div>

            {/* Star Selection */}
            <div className="flex gap-2 mb-6 justify-center">
              {[1,2,3,4,5].map((num) => (
                <Star 
                  key={num} size={36} 
                  className={`cursor-pointer transition-all ${num <= rating ? 'text-yellow-500 fill-yellow-500 scale-110' : 'text-white/10'}`}
                  onClick={() => setRating(num)}
                />
              ))}
            </div>

            <textarea 
              value={comment} onChange={(e) => setComment(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm mb-6 focus:ring-2 ring-blue-500/50 outline-none h-32 resize-none" 
              placeholder="How's your experience with ALSA AI? (Coding, PC Control, etc.)"
            />

            {/* Media Upload Area */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/10 rounded-3xl p-10 text-center mb-8 cursor-pointer hover:bg-white/5 hover:border-blue-500/40 transition-all group"
            >
              <input type="file" ref={fileInputRef} hidden accept="image/*,video/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              {file ? (
                <div className="flex items-center justify-center gap-2 text-blue-400 font-bold">
                  {file.type.startsWith('video') ? <Video size={20}/> : <ImageIcon size={20}/>}
                  <span className="truncate max-w-[200px]">{file.name}</span>
                </div>
              ) : (
                <>
                  <UploadCloud className="mx-auto mb-3 text-white/20 group-hover:text-blue-500 transition-colors" size={40} />
                  <p className="text-xs text-white/40 font-bold uppercase tracking-widest group-hover:text-white transition-colors">Attach Proof (Photo/Video)</p>
                </>
              )}
            </div>

            <Button 
              onClick={handleSubmit} disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-500 py-8 rounded-[2rem] font-black text-xl shadow-xl shadow-blue-500/20"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : "SHOUT IT OUT! 🚀"}
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Ratings;