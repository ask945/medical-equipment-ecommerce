import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, User, Clock, ArrowLeft, Share2, ChevronRight, BookOpen, Eye, MessageSquare } from 'lucide-react';
import { getBlogById, incrementBlogViews, addBlogComment } from '../services/blogService';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useData } from '../context/DataContext';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import '../css/BlogContent.css';

const BlogDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { blogs: allBlogs } = useData();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const { user } = useAuth();

  const recentBlogs = allBlogs.filter(b => b.id !== id).slice(0, 3);

  // Real-time blog listener
  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);

    const unsub = onSnapshot(doc(db, 'blogs', id), async (snap) => {
      if (!snap.exists() || snap.data().isActive === false) {
        navigate('/blog');
        return;
      }
      const data = {
        id: snap.id,
        ...snap.data(),
        createdAt: snap.data().createdAt?.toDate() || new Date(),
      };
      setBlog(data);
      setLoading(false);
    }, (err) => {
      console.error('Blog listener error:', err);
      navigate('/blog');
    });

    // Unique view tracking (fire once)
    const trackView = async () => {
      const deviceId = localStorage.getItem('deviceId') || `dev_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('deviceId', deviceId);
      const identifier = user ? user.uid : deviceId;
      await incrementBlogViews(id, identifier);
    };
    trackView();

    return unsub;
  }, [id, navigate, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Article Header */}
      <div className="bg-white border-b border-border">
        <div className="container-main max-w-4xl py-12">
          <Link to="/blog" className="inline-flex items-center gap-2 text-primary text-sm font-bold mb-8 hover:gap-3 transition-all">
            <ArrowLeft size={16} /> Back to Blog
          </Link>
          <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest mb-4">
            <span className="bg-primary/10 px-3 py-1 rounded-full">{blog.category}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-text-primary leading-tight mb-8">
            {blog.title}
          </h1>
          <div className="flex flex-wrap items-center justify-between gap-6 border-t border-border pt-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center">
                <User size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary">{blog.author}</p>
                <div className="flex items-center gap-3 text-xs text-text-secondary mt-1">
                  <span className="flex items-center gap-1"><Calendar size={14} /> {blog.createdAt instanceof Date ? blog.createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : (blog.createdAt?.toDate ? blog.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '')}</span>
                  <span className="flex items-center gap-1"><Clock size={14} /> {blog.readTime}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success('Link copied to clipboard!');
                }}
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-text-secondary hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm"
              >
                <Share2 size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-main max-w-4xl mt-12">
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-border">
          <img 
            src={blog.image} 
            alt={blog.title} 
            className="w-full max-h-[500px] object-cover"
          />
          <div className="p-8 md:p-12 lg:p-16">
            <article className="prose prose-blue max-w-none text-text-secondary leading-loose space-y-6">
              <div 
                className="blog-content"
                dangerouslySetInnerHTML={{ __html: blog.content }} 
              />
            </article>

            {blog.tags && blog.tags.length > 0 && (
              <div className="mt-12 pt-8 border-t border-slate-50 flex flex-wrap gap-2">
                <span className="text-sm font-black text-slate-900 mr-2 self-center uppercase tracking-wider">Tags:</span>
                {blog.tags.map(tag => (
                  <span key={tag} className="bg-slate-50 text-slate-500 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-tighter hover:bg-blue-600 hover:text-white transition-all cursor-pointer border border-slate-100">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Engagement Stats Bar */}
        <div className="mt-8 flex items-center justify-center gap-12 py-4 border-y border-slate-100">
            <div className="flex items-center gap-2 group">
              <Eye className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
              <span className="text-sm font-black text-slate-900">{blog.views || 0} <span className="text-slate-400 font-bold uppercase text-[10px] ml-1">Views</span></span>
            </div>
            <div className="flex items-center gap-2 group">
              <MessageSquare className="w-5 h-5 text-slate-300 group-hover:text-amber-500 transition-colors" />
              <span className="text-sm font-black text-slate-900">{blog.comments?.length || 0} <span className="text-slate-400 font-bold uppercase text-[10px] ml-1">Comments</span></span>
            </div>
        </div>

        {/* Comment Section */}
        <div className="mt-12 space-y-10" id="comments">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Post Engagement</h3>
            <div className="h-1 flex-1 bg-slate-50 mx-6 rounded-full" />
          </div>

          <div className="grid gap-10">
            {/* Comment Form */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Leave a Comment</h4>
                {user ? (
                  <div className="space-y-4">
                    <textarea 
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Share your thoughts on this educational piece..."
                      className="w-full h-32 p-5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 font-medium text-sm resize-none transition-all"
                    />
                    <div className="flex items-center justify-between">
                       <p className="text-[11px] text-slate-400 font-medium italic">Posting as <span className="text-blue-600 font-black">{user.name}</span></p>
                       <Button 
                         variant="primary" 
                         loading={submittingComment}
                         onClick={async () => {
                           if (!commentText.trim()) return toast.error("Write something first!");
                           setSubmittingComment(true);
                           try {
                             await addBlogComment(id, {
                               userId: user.uid,
                               userName: user.name,
                               message: commentText,
                               avatar: user.avatar
                             });
                             setCommentText('');
                             // Refresh local state
                             const updated = await getBlogById(id);
                             setBlog(updated);
                             toast.success("Comment added!");
                           } catch (err) {
                             toast.error("Failed to post comment");
                           } finally {
                             setSubmittingComment(false);
                           }
                         }}
                        >
                         Post Comment
                       </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-slate-400 text-sm font-medium mb-4">Join our community to participate in health discussions.</p>
                    <Button variant="primary" onClick={() => navigate('/signin')}>Sign In to Comment</Button>
                  </div>
                )}
            </div>

            {/* Comment List */}
            <div className="space-y-6">
              {blog.comments && blog.comments.length > 0 ? (
                blog.comments.map((comment, i) => (
                  <div key={i} className="flex gap-4 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-slate-200 flex-shrink-0 border border-slate-100 overflow-hidden flex items-center justify-center">
                       <svg className="w-7 h-7 text-slate-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                    </div>
                    <div className="flex-1">
                       <div className="flex items-center justify-between mb-1">
                          <h5 className="text-[13px] font-black text-slate-900">{comment.userName}</h5>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            {new Date(comment.commentedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                       </div>
                       <p className="text-[14px] text-slate-500 font-medium leading-relaxed">{comment.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 opacity-30">
                   <MessageSquare className="w-12 h-12 mx-auto mb-4" />
                   <p className="font-black uppercase text-xs tracking-widest">No comments yet. Start the conversation!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation between posts */}
        <div className="mt-12 py-12 border-y border-border flex flex-col sm:flex-row gap-6 items-center justify-between">
          <div className="max-w-[250px] text-center sm:text-left">
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Previous Post</p>
            <h4 className="text-sm font-bold text-text-primary line-clamp-1">Understanding CGM Sensors</h4>
          </div>
          <div className="w-px h-12 bg-border hidden sm:block"></div>
          <div className="max-w-[250px] text-center sm:text-right">
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Next Post</p>
            <h4 className="text-sm font-bold text-text-primary line-clamp-1">Respiratory Health Guide</h4>
          </div>
        </div>

        {/* Related Posts */}
        <div className="mt-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-extrabold text-text-primary">Related Articles</h2>
            <Link to="/blog" className="text-primary font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">
              View All <ChevronRight size={18} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentBlogs.map((post) => (
              <Link 
                key={post.id} 
                to={`/blog/${post.id}`}
                className="group bg-white rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-lg transition-all"
              >
                <div className="aspect-video relative overflow-hidden">
                  <img src={post.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-5">
                  <p className="text-[10px] font-bold text-primary uppercase mb-2">{post.category}</p>
                  <h3 className="text-md font-bold text-text-primary line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 bg-primary/5 rounded-3xl p-8 md:p-12 border border-primary/10 text-center relative overflow-hidden">
          <BookOpen className="absolute -right-8 -bottom-8 text-primary/5" size={160} />
          <h2 className="text-2xl md:text-3xl font-extrabold text-text-primary mb-4">Want more health tips?</h2>
          <p className="text-text-secondary max-w-xl mx-auto mb-8">
            Subscribe to our newsletter and get the latest updates on medical equipment, wellness advice, and exclusive offers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="flex-1 px-6 py-3 rounded-full border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
            />
            <Button variant="primary" size="lg">Subscribe</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogDetailPage;
