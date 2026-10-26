import { useState, useEffect } from 'react';
import PostCard from '../components/PostCard';
import { useDebounce } from '../hooks/useDebounce';
import * as api from '../services/api';

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const [keyword, setKeyword] = useState('');
  const debouncedKeyword = useDebounce(keyword, 400);

  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');

  useEffect(() => {
    setLoading(true);
    setError(null);
    const skip = (page - 1) * limit;

    const request = debouncedKeyword 
      ? api.searchPosts(debouncedKeyword) 
      : api.getPosts(limit, skip);

    request.then(data => {
      setPosts(data.posts);
      setTotal(data.total);
      setLoading(false);
    }).catch(err => {
      setError(err.message);
      setLoading(false);
    });
  }, [page, debouncedKeyword]);

  useEffect(() => {
    setPage(1);
  }, [debouncedKeyword]);

  const handleAddPost = (e) => {
    e.preventDefault();
    if (!newTitle || !newBody) return;
    
    api.addPost({ title: newTitle, body: newBody }).then(newPost => {
      setPosts([newPost, ...posts]);
      setNewTitle('');
      setNewBody('');
    }).catch(err => alert("Add error: " + err.message));
  };

  const handleDeletePost = (id) => {
    if (window.confirm("Confirm delete? ")) {
      api.deletePost(id).then(() => {
        setPosts(posts.filter(p => p.id !== id));
        if (selectedPost?.id === id) setSelectedPost(null);
      }).catch(err => alert("Delete error: " + err.message));
    }
  };

  const handleViewPost = (post) => {
    setSelectedPost(post);
    setComments([]);
    api.getComments(post.id).then(data => setComments(data.comments));
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px', display: 'flex', gap: '40px' }}>

      <div style={{ flex: '1.5' }}>
        <h1>Mini Blog Manager</h1>

        <div className="card">
          <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px' }}>New post</h3>
          <form className="form-group" onSubmit={handleAddPost}>
            <input 
              className="input-field" 
              value={newTitle} 
              onChange={e => setNewTitle(e.target.value)} 
              placeholder="Title" 
              required 
            />
            <textarea 
              className="input-field" 
              value={newBody} 
              onChange={e => setNewBody(e.target.value)} 
              placeholder="Body" 
              required 
              rows={4} 
            />
            <button type="submit" className="btn btn-primary">Add post</button>
          </form>
        </div>

        <input 
          type="text" 
          className="input-field"
          placeholder="Search posts..." 
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          style={{ marginBottom: '24px', backgroundColor: 'white' }}
        />

        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {loading && <p>Loading...</p>}

        {!loading && posts.map(post => (
          <PostCard key={post.id} post={post} onView={handleViewPost} onDelete={handleDeletePost} />
        ))}

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginTop: '20px', justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={() => setPage(page - 1)} disabled={page === 1}>Previous</button>
          <span style={{ fontWeight: '600' }}>Page {page} of {totalPages}</span>
          <button className="btn btn-secondary" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>Next</button>
        </div>
      </div>

      <div style={{ flex: '1' }}>
        <div className="card" style={{ position: 'sticky', top: '40px' }}>
          {selectedPost ? (
            <div>
              <h2 style={{ marginTop: 0, color: '#1e293b' }}>{selectedPost.title}</h2>
              <div className="tags">
                {selectedPost.tags?.map(tag => (
                  <span key={tag} className="tag">#{tag}</span>
                ))}
              </div>
              <p style={{ lineHeight: '1.6', color: '#475569' }}>{selectedPost.body}</p>
              
              <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />
              
              <h3 style={{ fontSize: '16px' }}>Comments ({comments.length})</h3>
              {comments.length === 0 ? <p style={{ color: '#94a3b8' }}>No comment yet!</p> : (
                <ul style={{ paddingLeft: '20px', color: '#475569' }}>
                  {comments.map(c => (
                    <li key={c.id} style={{ marginBottom: '12px' }}>
                      <strong style={{ color: '#1e293b' }}>{c.user.username}:</strong> {c.body}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <p style={{ color: '#94a3b8', textAlign: 'center', margin: '40px 0' }}>Click view in any blog to see content and comment.</p>
          )}
        </div>
      </div>
      
    </div>
  );
}