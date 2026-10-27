const usersService = require("../services/users.service");

async function create(req, res) {
  const { username, email, fullname, bio } = req.body ?? {};
  if (![username, email, fullname].every((value) => typeof value === "string" && value.trim())) {
    return res.status(400).json({ error: "username, email and fullname are required" });
  }

  try {
    const user = await usersService.createUser({ username, email, fullname, bio });
    return res.status(201).json(user);
  } catch (error) {
    if (error.code === "P2002" || error.code === "USER_TAKEN") {
      return res.status(409).json({ error: "username or email already taken" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function list(req, res) {
  const { page: pageParam, limit: limitParam, sortBy, order, isPrivate, search } = req.query;
  const page = pageParam === undefined ? 1 : Number(pageParam);
  const requestedLimit = limitParam === undefined ? 10 : Number(limitParam);
  const isPositiveInteger = (value) => typeof value === "string" && /^[1-9]\d*$/.test(value);
  if ((pageParam !== undefined && !isPositiveInteger(pageParam)) ||
      (limitParam !== undefined && !isPositiveInteger(limitParam))) {
    return res.status(400).json({ error: "page and limit must be positive integers" });
  }
  if (sortBy !== undefined && !["createdAt", "username", "fullname"].includes(sortBy)) {
    return res.status(400).json({ error: "sortBy must be one of: createdAt, username, fullname" });
  }
  if (order !== undefined && !["asc", "desc"].includes(order)) {
    return res.status(400).json({ error: "order must be asc or desc" });
  }
  if (isPrivate !== undefined && !["true", "false"].includes(isPrivate)) {
    return res.status(400).json({ error: "isPrivate must be true or false" });
  }

  try {
    const result = await usersService.listUsers({
      page,
      limit: Math.min(requestedLimit, 50),
      sortBy: sortBy ?? "createdAt",
      order: order ?? "desc",
      isPrivate: isPrivate === undefined ? undefined : isPrivate === "true",
      search: typeof search === "string" ? search : undefined,
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function getOne(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(404).json({ error: "User not found" });
  try {
    const user = await usersService.getUserById(id);
    return user ? res.status(200).json(user) : res.status(404).json({ error: "User not found" });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function update(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(404).json({ error: "User not found" });
  const data = {};
  for (const field of ["fullname", "bio", "isPrivate"]) {
    if (Object.prototype.hasOwnProperty.call(req.body ?? {}, field)) data[field] = req.body[field];
  }
  try {
    return res.status(200).json(await usersService.updateUser(id, data));
  } catch (error) {
    if (error.code === "P2025") return res.status(404).json({ error: "User not found" });
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function remove(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(404).json({ error: "User not found" });
  try {
    await usersService.deleteUser(id);
    return res.status(204).end();
  } catch (error) {
    if (error.code === "P2025") return res.status(404).json({ error: "User not found" });
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { create, list, getOne, update, remove };