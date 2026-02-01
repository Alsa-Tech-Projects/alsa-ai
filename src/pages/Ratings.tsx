import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; 
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MessageCircle, Heart, Share2, Plus, Image as ImageIcon, Video, CheckCircle2, X, UploadCloud } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

const Ratings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Stats Logic
  const stats = { average: 4.9, total: 1240 };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/auth'); return; }
      setUser(session.user);
      fetchReviews();
    };
    checkAuth();

    // Real-time listener for "Live Feed"
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reviews' }, 
      (payload) => {
        setReviews((prev) => [payload.new, ...prev]);
        toast.success("New rating just landed!");
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [navigate]);

  const fetchReviews = async () => {
    const { data } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
    if (data) setReviews(data);
  };

  return (
    <div className="min-h-screen bg-[#0A1A2F] text-white pt-24 pb-12 px-4 selection:bg-blue-500/30">
      <div className="container mx-auto max-w-6xl">
        
        {/* Header with Animated Entrance */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-center gap-6 mb-16"
        >
          <div className="text-center md:text-left">
            <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter italic bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
              FEEDBACK
            </h1>
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="flex text-yellow-500">
                {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
              </div>
              <span className="text-white/60 font-mono">LIVE: {stats.total}+ Reviews</span>
            </div>
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="group bg-blue-600 hover:bg-blue-500 text-white rounded-2xl px-8 py-8 text-lg font-bold shadow-[0_0_30px_rgba(37,99,235,0.3)] transition-all hover:scale-105"
          >
            <Plus className="mr-2 group-hover:rotate-90 transition-transform" /> Post Review
          </Button>
        </motion.div>

        {/* Live Feed Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {reviews.map((rev, i) => (
              <motion.div
                key={rev.id || i}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Card className="bg-[#112240]/50 border-white/5 backdrop-blur-md rounded-[2.5rem] overflow-hidden hover:border-blue-500/40 transition-colors group">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 border border-white/10" />
                      <div>
                        <h4 className="text-sm font-bold flex items-center gap-1">{rev.user_name || 'Alsa User'} <CheckCircle2 size={14} className="text-blue-400" /></h4>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Verified Member</p>
                      </div>
                    </div>
                    
                    <p className="text-white/80 text-sm leading-relaxed mb-4 italic">"{rev.comment || 'Amazing experience with ALSA AI!'}"</p>

                    {/* Media Display */}
                    <div className="relative rounded-3xl overflow-hidden bg-black/40 aspect-[4/3] border border-white/5 mb-4 flex items-center justify-center">
                       {rev.media_url ? (
                         <img src={rev.media_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Review" />
                       ) : (
                         <div className="text-white/10 flex flex-col items-center">
                           <ImageIcon size={40} strokeWidth={1} />
                           <span className="text-[10px] mt-2 uppercase font-black">No Media Attached</span>
                         </div>
                       )}
                    </div>

                    <div className="flex items-center justify-between opacity-60 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-4">
                        <button className="flex items-center gap-1 hover:text-pink-500 transition-colors"><Heart size={18} /> <span className="text-xs">2.4k</span></button>
                        <button className="flex items-center gap-1 hover:text-blue-500 transition-colors"><MessageCircle size={18} /> <span className="text-xs">12</span></button>
                      </div>
                      <Share2 size={18} className="cursor-pointer hover:text-white" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Upload Modal Overlay - Simple Logic */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#0A1A2F] border border-white/10 p-8 rounded-[3rem] max-w-md w-full relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-white/40 hover:text-white"><X /></button>
            <h3 className="text-2xl font-bold mb-6">Drop your feedback</h3>
            <textarea className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm mb-4 focus:outline-none focus:border-blue-500 h-32" placeholder="Tell us how ALSA changed your workflow..."></textarea>
            <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center mb-6 hover:bg-white/5 transition-colors cursor-pointer group">
               <UploadCloud className="mx-auto mb-2 text-white/20 group-hover:text-blue-400 transition-colors" />
               <p className="text-xs text-white/40 italic">Click to upload Screenshot or Video</p>
            </div>
            <Button className="w-full bg-blue-600 py-6 rounded-2xl font-bold shadow-lg shadow-blue-500/20">Submit Post</Button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Ratings;