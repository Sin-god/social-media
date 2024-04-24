const express = require("express");
const router = express.Router();
const multer = require("multer");
const UserController = require("../controllers/user.controller");
const PostController = require("../controllers/post-controller");
const CommentController = require("../controllers/comment-controller");
const authenticateToken = require("../middleware/auth");
const LikeController = require("../controllers/like-controller");
const { FollowController } = require("../controllers");

const uploadDestination = "uploads";

// Показати де збирігати файли
const storage = multer.diskStorage({
  destination: uploadDestination,
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const uploads = multer({ storage: storage });

//User Routes
router.post("/register", UserController.register);
router.post("/login", UserController.login);
router.get("/current", authenticateToken, UserController.current);
router.get("/users/:id", authenticateToken, UserController.getUserById);
router.put("/users/:id", authenticateToken, UserController.updateUser);

//Post  Routes
router.post("/posts", authenticateToken, PostController.createPost);
router.get("/posts", authenticateToken, PostController.getAllPosts);
router.get("/posts/:id", authenticateToken, PostController.getPostById);
router.delete("/posts/:id", authenticateToken, PostController.deletePost);

// Comment  Routes
router.post("/comments", authenticateToken, CommentController.createComment);
router.delete(
  "/comments/:id",
  authenticateToken,
  CommentController.deleteComment
);

//Like Routes
router.post("/likes", authenticateToken, LikeController.likePost);
router.delete("/likes/:id", authenticateToken, LikeController.unLikePost);

//Follows Routes
router.post("/follow", authenticateToken, FollowController.followUser);
router.delete(
  "/unfollow/:id",
  authenticateToken,
  FollowController.unfollowUser
);
module.exports = router;
