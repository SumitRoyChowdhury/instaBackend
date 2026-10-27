const prisma = require("../db");

async function createLike(postId, userId) {
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) throw Object.assign(new Error("Post not found"), { code: "POST_NOT_FOUND" });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) throw Object.assign(new Error("User not found"), { code: "USER_NOT_FOUND" });

  try {
    return await prisma.like.create({ data: { postId, userId } });
  } catch (error) {
    if (error.code === "P2002") {
      throw Object.assign(new Error("Already liked"), { code: "ALREADY_LIKED" });
    }
    throw error;
  }
}

async function deleteLike(postId, userId) {
  try {
    return await prisma.like.delete({ where: { userId_postId: { userId, postId } } });
  } catch (error) {
    if (error.code === "P2025") {
      throw Object.assign(new Error("Like not found"), { code: "LIKE_NOT_FOUND" });
    }
    throw error;
  }
}

module.exports = { createLike, deleteLike };