const prisma = require("../db");

async function createUser(data) {
  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ username: data.username }, { email: data.email }] },
  });
  if (existingUser) throw Object.assign(new Error("username or email already taken"), { code: "USER_TAKEN" });
  return prisma.user.create({ data });
}

function listUsers({ page, limit, sortBy, order, isPrivate, search, hasPosts }) {
  const where = {};
  if (isPrivate !== undefined) where.isPrivate = isPrivate;
  if (hasPosts !== undefined) where.posts = hasPosts ? { some: {} } : { none: {} };
  if (search) {
    where.OR = [
      { username: { contains: search, mode: "insensitive" } },
      { fullname: { contains: search, mode: "insensitive" } },
    ];
  }

  return prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]).then(([data, total]) => ({
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }));
}

function getUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    include: { _count: { select: { posts: true, likes: true } } },
  });
}

function listUserPosts(userId, { page, limit }) {
  const where = { authorId: userId };
  return prisma.$transaction([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { _count: { select: { likes: true } } },
    }),
    prisma.post.count({ where }),
  ]).then(([data, total]) => ({
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }));
}

function listLikedPosts(userId, { page, limit }) {
  const where = { likes: { some: { userId } } };
  return prisma.$transaction([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
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

function updateUser(id, data) {
  return prisma.user.update({ where: { id }, data });
}

function deleteUser(id) {
  return prisma.user.delete({ where: { id } });
}

module.exports = { createUser, listUsers, getUserById, listUserPosts, listLikedPosts, updateUser, deleteUser };