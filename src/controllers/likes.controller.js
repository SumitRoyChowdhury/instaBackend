const likesService = require("../services/likes.service");

async function create(req, res) {
  const { userId } = req.body ?? {};
  if (userId === undefined || userId === null) return res.status(400).json({ error: "userId is required" });

  const postId = Number(req.params.id);
  if (!Number.isInteger(postId)) return res.status(404).json({ error: "Post not found" });

  try {
    return res.status(201).json(await likesService.createLike(postId, Number(userId)));
  } catch (error) {
    if (error.code === "POST_NOT_FOUND") return res.status(404).json({ error: "Post not found" });
    if (error.code === "USER_NOT_FOUND") return res.status(404).json({ error: "User not found" });
    if (error.code === "ALREADY_LIKED") return res.status(409).json({ error: "Already liked" });
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function remove(req, res) {
  const postId = Number(req.params.id);
  const userId = Number(req.params.userId);
  if (!Number.isInteger(postId) || !Number.isInteger(userId)) {
    return res.status(404).json({ error: "Like not found" });
  }

  try {
    await likesService.deleteLike(postId, userId);
    return res.status(204).end();
  } catch (error) {
    if (error.code === "LIKE_NOT_FOUND") return res.status(404).json({ error: "Like not found" });
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { create, remove };