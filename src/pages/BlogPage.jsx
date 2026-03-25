import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, User, Clock, ArrowRight, BookOpen } from 'lucide-react';
import { useData } from '../context/DataContext';
import Button from '../components/Button';

const BlogPage = () => {
  const { blogs, blogsLoading: loading } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', ...new Set(blogs.map(blog => blog.category))];

  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || blog.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      {/* Hero Section */}
      <section className="bg-white border-b border-border py-16">
        <div className="container-main text-center">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-text-primary mb-4">Health & Wellness Blog</h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Expert advice, health tips, and the latest news in medical technology to help you live a healthier life.
          </p>
        </div>
      </section>

      <div className="container-main mt-12">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Main Content */}
          <div className="flex-1">
            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-border mb-8 flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search articles..." 
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                      selectedCategory === cat 
                        ? 'bg-primary text-white shadow-md' 
                        : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Blog Grid */}
            {filteredBlogs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredBlogs.map((blog) => (
                  <Link 
                    to={`/blog/${blog.id}`} 
                    key={blog.id}
                    className="group bg-white rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all duration-300"
                  >
                    <div className="aspect-video relative overflow-hidden">
                      <img 
                        src={blog.image} 
                        alt={blog.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm text-primary text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                        {blog.category}
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-4 text-xs text-text-secondary mb-3">
                        <span className="flex items-center gap-1"><Calendar size={14} /> {blog.createdAt instanceof Date ? blog.createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : (blog.createdAt?.toDate ? blog.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '')}</span>
                        <span className="flex items-center gap-1"><Clock size={14} /> {blog.readTime}</span>
                      </div>
                      <h3 className="text-xl font-bold text-text-primary mb-3 group-hover:text-primary transition-colors line-clamp-2">
                        {blog.title}
                      </h3>
                      <p className="text-text-secondary text-sm mb-6 line-clamp-2 leading-relaxed">
                        {blog.excerpt}
                      </p>
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center">
                            <User size={14} className="text-primary" />
                          </div>
                          <span className="text-xs font-medium text-text-primary">{blog.author}</span>
                        </div>
                        <span className="text-primary font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                          Read More <ArrowRight size={16} />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center border border-border">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search size={32} className="text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">No articles found</h3>
                <p className="text-text-secondary mb-6">Try adjusting your search or category filters.</p>
                <Button variant="secondary" onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}>
                  Clear all filters
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="w-full lg:w-80 space-y-8">
            <div className="bg-primary rounded-2xl p-6 text-white overflow-hidden relative">
              <BookOpen className="absolute -right-4 -bottom-4 text-white/10" size={120} />
              <h3 className="text-xl font-bold mb-3 relative z-10">Care Newsletter</h3>
              <p className="text-white/80 text-sm mb-6 relative z-10">
                Get the latest health tips and product updates delivered to your inbox.
              </p>
              <div className="space-y-3 relative z-10">
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  className="w-full p-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:bg-white text-text-primary transition-all"
                />
                <button className="w-full bg-white text-primary font-bold py-2.5 rounded-lg hover:bg-gray-100 transition-colors shadow-lg">
                  Subscribe Now
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-border shadow-sm">
              <h3 className="text-lg font-bold text-text-primary mb-4 border-b border-border pb-2">Recent Posts</h3>
              <div className="space-y-4">
                {blogs.slice(0, 3).map(blog => (
                  <Link to={`/blog/${blog.id}`} key={blog.id} className="flex gap-3 group">
                    <img 
                      src={blog.image} 
                      alt="" 
                      className="w-16 h-16 rounded-lg object-cover group-hover:opacity-80 transition-opacity"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-text-primary line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                        {blog.title}
                      </h4>
                      <p className="text-[10px] text-text-secondary mt-1">{blog.createdAt instanceof Date ? blog.createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : (blog.createdAt?.toDate ? blog.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '')}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default BlogPage;
