const postsService = require("../services/posts.service");
const parsePagination = require("../utils/pagination");

async function create(req, res) {
  const { imageUrl, authorId, caption, location } = req.body ?? {};
  if (typeof imageUrl !== "string" || !imageUrl.trim() || authorId === undefined || authorId === null) {
    return res.status(400).json({ error: "imageUrl and authorId are required" });
  }
  if (!Number.isInteger(authorId) || authorId < 1) return res.status(404).json({ error: "User not found" });
  try {
    return res.status(201).json(await postsService.createPost({ imageUrl, authorId, caption, location }));
  } catch (error) {
    if (error.code === "P2003") return res.status(404).json({ error: "User not found" });
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function list(req, res) {
  const { sortBy, order, location, search, from, to } = req.query;
  const pagination = parsePagination(req.query);
  if (!pagination) {
    return res.status(400).json({ error: "page and limit must be positive integers" });
  }
  if (sortBy !== undefined && !["createdAt", "updatedAt", "likes"].includes(sortBy)) {
    return res.status(400).json({ error: "sortBy must be one of: createdAt, updatedAt, likes" });
  }
  if (order !== undefined && !["asc", "desc"].includes(order)) {
    return res.status(400).json({ error: "order must be asc or desc" });
  }
  const isValidDate = (value) => {
    if (typeof value !== "string" || Number.isNaN(Date.parse(value))) return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return true;
    return new Date(value).toISOString().slice(0, 10) === value;
  };
  if ((from !== undefined && !isValidDate(from)) || (to !== undefined && !isValidDate(to))) {
    return res.status(400).json({ error: "from and to must be valid dates" });
  }

  try {
    const result = await postsService.listPosts({
      ...pagination,
      sortBy: sortBy ?? "createdAt",
      order: order ?? "desc",
      location: typeof location === "string" ? location : undefined,
      search: typeof search === "string" ? search : undefined,
      from: from === undefined ? undefined : new Date(from),
      to: to === undefined ? undefined : new Date(to),
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function likers(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(404).json({ error: "Post not found" });
  try {
    const post = await postsService.getPostLikers(id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    return res.status(200).json(post.likes.map((like) => like.user));
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

module.exports = { create, list, getOne, likers, update, remove };