db.posts.updateOne(
  { title: "Node.js tutorial" },
  {
    $push: { comments: { user: "Khach Vang Lai", content: "Cảm ơn tác giả nhiều!", created_at: new Date() } },
    $inc: { views: 1 }
  }
);