const { prisma } = require("../prisma/prisma-client");

const LikeController = {
  likePost: async (req, res) => {
    const { postId } = req.body;
    const userId = req.user.userId;

    if (!postId) {
      return res.status(400).json({ error: "Усі поля обов'язкові" });
    }

    try {
      const existiongLike = await prisma.like.findFirst({
        where: { postId, userId },
      });

      if (existiongLike) {
        return res.status(400).json({ error: "Ви вже поставили лайк" });
      }

      const like = await prisma.like.create({
        data: {
          postId,
          userId,
        },
      });
      res.json(like);
    } catch (error) {
      console.log("🚀 ~ likePost: ~ error:", error);
      res.status(500).json({ error: "internal server error" });
    }
  },
  unLikePost: async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    if (!id) {
      return res.status(400).json({ error: "Ви вже поставили дізлайк!" });
    }

    try {
      const existiongLike = await prisma.like.findFirst({
        where: { postId: id, userId },
      });

      if (!existiongLike) {
        return res.status(400).json({ error: "Лайк вже існує" });
      }

      const like = await prisma.like.deleteMany({
        where: { postId: id, userId },
      });

      res.json(like);
    } catch (error) {
      console.log("🚀 ~ likePost: ~ error:", error);
      res.status(500).json({ error: "internal server error" });
    }
  },
};

module.exports = LikeController;
