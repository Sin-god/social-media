const { prisma } = require("../prisma/prisma-client");
const bcrypt = require("bcryptjs");
const Jdenticon = require("jdenticon");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const UserController = {
  register: async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ error: "Усі пункти обов'язкові для заповнення" });
    }

    try {
      const existiongUser = await prisma.user.findUnique({ where: { email } });

      if (existiongUser) {
        return res
          .status(400)
          .json({ error: "Користувач із цією поштою вже існує" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const png = Jdenticon.toPng(name, 200);
      const avatarName = `${name}_${Date.now()}.png`;
      const avatarPath = path.join(__dirname, "/../uploads", avatarName);
      fs.writeFileSync(avatarPath, png);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          avatarUrl: `/uploads/${avatarName}`,
        },
      });
      res.json(user);
    } catch (error) {
      console.log("🚀 ~ register: ~ error:", error);
      res.status(500).json({ error: "internal server error" });
    }
  },
  login: async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Усі пункти обов'язкові для заповнення" });
    }

    try {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        return res.status(400).json({ error: "Не вірний логін або пароль" });
      }

      const valid = await bcrypt.compare(password, user.password);

      if (!valid) {
        return res.status(400).json({ error: "Не вірний логін або пароль" });
      }

      const token = jwt.sign({ userId: user.id }, process.env.SECRET_KEY);

      res.json({ token });
    } catch (error) {
      console.log("🚀 ~ login: ~ error:", error);
      res.status(500).json({ error: "internal server error" });
    }
  },
  getUserById: async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          followers: true,
          following: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: "Користувач не знайден" });
      }

      const isFollowing = await prisma.follows.findFirst({
        where: {
          AND: [{ followerId: userId }, { followingId: id }],
        },
      });
      res.json({ ...user, isFollowing: Boolean(isFollowing) });
    } catch (error) {
      console.log("🚀 ~ login: ~ error:", error);
      res.status(500).json({ error: "internal server error" });
    }
  },
  updateUser: async (req, res) => {
    const { id } = req.params;
    const { email, name, dateOfBirth, bio, location } = req.body;
    console.log("🚀 ~ updateUser: ~ email:", email);

    let filePath;

    if (req.file && req.filePath) {
      filePath = req.filePath;
    }

    if (id !== req.user.userId) {
      return res.status(403).json({ error: "Немає досупу" });
    }

    try {
      if (email) {
        const existingUser = await prisma.user.findFirst({
          where: { email: email },
        });

        console.log("🚀 ~ updateUser: ~ name:", name);

        if (existingUser && existingUser.id !== parseInt(id)) {
          return res.status(400).json({ error: "Пошта вже зайнята" });
        }
      }

      const user = await prisma.user.update({
        where: { id },
        data: {
          email: email || undefined,
          name: name || undefined,
          avatarUrl: filePath ? `/${filePath}` : undefined,
          dateOfBirth: dateOfBirth || undefined,
          bio: bio || undefined,
          location: location || undefined,
        },
      });
      res.json(user);
    } catch (error) {
      console.log("🚀 ~ updateUser: ~ error:", error);
      res.status(500).json({ error: "internal server error" });
    }
  },
  current: async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        include: {
          followers: {
            include: {
              follower: true,
            },
          },
          following: {
            include: {
              following: true,
            },
          },
        },
      });
      console.log("🚀 ~ current: ~ user:", user);
      if (!user) {
        return res.status(400).json({ error: "Не вдалось знайти користувача" });
      }

      res.json(user);
    } catch (error) {
      console.log("🚀 ~ current: ~ error:", error);
      res.status(500).json({ error: "internal server error" });
    }
  },
};

module.exports = UserController;
