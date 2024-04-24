const { prisma } = require("../prisma/prisma-client");

const PostController = {
  createPost: async (req, res) => {
    const { content } = req.body;

    const authorId = req.user.userId;

    if (!content) {
      return res.status(400).json({ error: "Всі поля обов'язкові" });
    }

    try {
      const post = await prisma.post.create({
        data: {
          content,
          authorId,
        },
      });

      res.json(post);
    } catch (error) {
      console.log("🚀 ~ createPost: ~ error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
  getAllPosts: async (req, res) => {
    const userId = req.user.userId;

    try {
      const posts = await prisma.post.findMany({
        include: {
          likes: true,
          author: true,
          comments: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const postWithLikeInfo = posts.map((post) => ({
        ...post,
        likeByUser: post.likes.some((like) => like.userId === userId),
      }));

      res.json(postWithLikeInfo);
    } catch (error) {
      console.log("🚀 ~ getAllPosts: ~ error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
  getPostById: async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
      const post = await prisma.post.findUnique({
        where: { id },
        include: {
          comments: {
            include: {
              user: true,
            },
          },
          likes: true,
          author: true,
        },
      });

      if (!post) {
        return res.status(404).json({ error: "Пост не знайдено" });
      }

      const postWithLikeInfo = {
        ...post,
        likeByUser: post.likes.some((like) => like.userId === userId),
      };
      res.json(postWithLikeInfo);
    } catch (error) {
      console.log("🚀 ~ getPostById: ~ error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
  deletePost: async (req, res) => {
    const { id } = req.params;
    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return res.status(404).json({ error: "Пост не знайдено" });
    }

    if (post.authorId !== req.user.userId) {
      return res.status(404).json({ error: "Немає доступа" });
    }

    try {
      const transaction = await prisma.$transaction([
        prisma.comment.deleteMany({
          where: {
            postId: id,
          },
        }),
        prisma.like.deleteMany({
          where: {
            postId: id,
          },
        }),
        prisma.post.delete({
          where: {
            id,
          },
        }),
      ]);
      res.json(transaction);
    } catch (error) {
      console.log("🚀 ~ deletePost: ~ error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
};

module.exports = PostController;
