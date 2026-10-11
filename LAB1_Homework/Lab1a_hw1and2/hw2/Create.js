db.posts.insertMany([
  {
    title: "Node.js tutorial",
    category: "Tech",
    views: 220,
    author: { name: "Nguyen Van A", email: "NguyenVanA@gmail.com" },
    tags: ["nodejs", "express", "backend"],
    comments: [
      { user: "Nguyen Van A", content: "Must read!", created_at: new Date() }
    ]
  },
  {
    title: "MySQL and MongoDB courses",
    category: "Tech",
    views: 20,
    author: { name: "Sieu Ba Khi", email: "BaKhi@gmail.com" },
    tags: ["MySQL", "MongoDB", "backend"],
    comments: [
      { user: "Ngo Ba Kha", content: "Terrible", created_at: new Date() }
    ]
  },
  {
    title: "Coding with AI",
    category: "Lifestyle",
    views: 500,
    author: { name: "Mr.Beast", email: "MrBeast@gmail.com" },
    tags: ["story", "career", "life"],
    comments: [
      { user: "Mít Tờ Bít", content: "Hay", created_at: new Date() },
      { user: "HihiHaha", content: "Ok", created_at: new Date() }
    ]
  }
]);

