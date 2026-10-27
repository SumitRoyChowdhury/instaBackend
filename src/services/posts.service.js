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
      orderBy: sortBy === "likes"
        ? [{ likes: { _count: order } }, { createdAt: "desc" }]
        : { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: { select: { id: true, username: true, fullname: true } },
        _count: { select: { likes: true } },
      },
    }),
    prisma.post.count({ where }),
  ]).then(([data, total]) => ({
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }));
}

function getPostById(id) {
  return prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, username: true, fullname: true } },
      _count: { select: { likes: true } },
    },
  });
}

function getPostLikers(id) {
  return prisma.post.findUnique({
    where: { id },
    select: {
      likes: {
        orderBy: { user: { username: "asc" } },
        select: { user: { select: { id: true, username: true, fullname: true } } },
      },
    },
  });
}

function updatePost(id, data) {
  return prisma.post.update({ where: { id }, data });
}

function deletePost(id) {
  return prisma.post.delete({ where: { id } });
}

module.exports = { createPost, listPosts, getPostById, getPostLikers, updatePost, deletePost };