const prisma = require("../db");

async function createUser(data) {
  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ username: data.username }, { email: data.email }] },
  });
  if (existingUser) throw Object.assign(new Error("username or email already taken"), { code: "USER_TAKEN" });
  return prisma.user.create({ data });
}

function listUsers() {
  return prisma.user.findMany();
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