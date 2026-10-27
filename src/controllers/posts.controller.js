const postsService = require("../services/posts.service");

async function create(req, res) {
  const { imageUrl, caption, location } = req.body ?? {};
  if (typeof imageUrl !== "string" || !imageUrl.trim()) {
    return res.status(400).json({ error: "imageUrl is required" });
  }
  try {
    return res.status(201).json(await postsService.createPost({ imageUrl, caption, location }));
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function list(req, res) {
  try {
    return res.status(200).json(await postsService.listPosts());
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function getOne(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(404).json({ error: "Post not found" });
  try {
    const post = await postsService.getPostById(id);
    return post ? res.status(200).json(post) : res.status(404).json({ error: "Post not found" });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function update(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(404).json({ error: "Post not found" });
  const data = {};
  for (const field of ["caption", "location"]) {
    if (Object.prototype.hasOwnProperty.call(req.body ?? {}, field)) data[field] = req.body[field];
  }
  try {
    return res.status(200).json(await postsService.updatePost(id, data));
  } catch (error) {
    if (error.code === "P2025") return res.status(404).json({ error: "Post not found" });
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function remove(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(404).json({ error: "Post not found" });
  try {
    await postsService.deletePost(id);
    return res.status(204).end();
  } catch (error) {
    if (error.code === "P2025") return res.status(404).json({ error: "Post not found" });
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { create, list, getOne, update, remove };