const prisma = require("../db");

function createPost(data) {
  return prisma.post.create({ data });
}

function listPosts({ page, limit, sortBy, order, location, search, from, to }) {
  const where = {};
  const filters = [];
  if (location) filters.push({ location: { equals: location, mode: "insensitive" } });
  if (search) filters.push({ caption: { contains: search, mode: "insensitive" } });
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lt = to;
  }
  if (filters.length) where.AND = filters;

  return prisma.$transaction([
    prisma.post.findMany({
      where,
      orderBy: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]).then(([data, total]) => ({
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }));
}

function getPostById(id) {
  return prisma.post.findUnique({ where: { id } });
}

function updatePost(id, data) {
  return prisma.post.update({ where: { id }, data });
}

function deletePost(id) {
  return prisma.post.delete({ where: { id } });
}

module.exports = { createPost, listPosts, getPostById, updatePost, deletePost };