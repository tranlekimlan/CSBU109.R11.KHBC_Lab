export default function PostCard({ post, onView, onDelete }) {
  const likes = post.reactions?.likes || 0;
  const dislikes = post.reactions?.dislikes || 0;

  return (
    <div className="card post-card">
      <h3>{post.title}</h3>

      <div className="tags">
        {post.tags?.map(tag => (
          <span key={tag} className="tag">
            #{tag}
          </span>
        ))}
      </div>

      <div className="reactions">
        <span>👍 {likes}</span>
        <span>·</span>
        <span>👎 {dislikes}</span>
      </div>

      <div className="actions">
        <button className="btn btn-secondary" onClick={() => onView(post)}>View</button>
        <button className="btn btn-danger" onClick={() => onDelete(post.id)}>Delete</button>
      </div>
    </div>
  );
}