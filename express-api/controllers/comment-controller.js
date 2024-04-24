const { prisma } = require("../prisma/prisma-client");

const CommentController = {
  createComment: async (req, res) => {
    console.log("🚀 ~ createComment: ~ req:", req);
    const { postId, content } = req.body;
    const userId = req.user.userId;

    if (!postId || !content) {
      return res.status(400).json({ error: "Всі поля обов'язкові" });
    }

    try {
      const comment = await prisma.comment.create({
        data: {
          postId,
          userId,
          content,
        },
      });

      res.json(comment);
    } catch (error) {
      console.log("🚀 ~ createComment: ~ error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
  deleteComment: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const comment = await prisma.comment.findUnique({ where: { id } });

      if (!comment) {
        return res.status(404).json({ error: "Коментар не знайдено" });
      }

      if (comment.userId !== userId) {
        return res.status(403).json({ error: "Немає доступа" });
      }

      await prisma.comment.delete({ where: { id } });
      res.json(comment);
    } catch (error) {
      console.log("🚀 ~ deleteComment: ~ error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
};

module.exports = CommentController;
