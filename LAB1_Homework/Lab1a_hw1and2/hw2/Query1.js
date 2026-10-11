db.posts.find({ category: "Tech", views: { $gte: 100 } });
