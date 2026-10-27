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
  const { page: pageParam, limit: limitParam, sortBy, order, location, search, from, to } = req.query;
  const page = pageParam === undefined ? 1 : Number(pageParam);
  const requestedLimit = limitParam === undefined ? 10 : Number(limitParam);
  const isPositiveInteger = (value) => typeof value === "string" && /^[1-9]\d*$/.test(value);
  if ((pageParam !== undefined && !isPositiveInteger(pageParam)) ||
      (limitParam !== undefined && !isPositiveInteger(limitParam))) {
    return res.status(400).json({ error: "page and limit must be positive integers" });
  }
  if (sortBy !== undefined && !["createdAt", "updatedAt"].includes(sortBy)) {
    return res.status(400).json({ error: "sortBy must be one of: createdAt, updatedAt" });
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
      page,
      limit: Math.min(requestedLimit, 50),
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