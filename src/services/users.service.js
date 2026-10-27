const prisma = require("../db");

async function createUser(data) {
  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ username: data.username }, { email: data.email }] },
  });
  if (existingUser) throw Object.assign(new Error("username or email already taken"), { code: "USER_TAKEN" });
  return prisma.user.create({ data });
}

function listUsers({ page, limit, sortBy, order, isPrivate, search }) {
  const where = {};
  if (isPrivate !== undefined) where.isPrivate = isPrivate;
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
  return prisma.user.findUnique({ where: { id } });
}

function updateUser(id, data) {
  return prisma.user.update({ where: { id }, data });
}

function deleteUser(id) {
  return prisma.user.delete({ where: { id } });
}

module.exports = { createUser, listUsers, getUserById, updateUser, deleteUser };