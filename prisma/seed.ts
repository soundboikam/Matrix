import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("matrix123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@matrix.local" },
    update: {},
    create: { email: "admin@matrix.local", name: "Admin", passwordHash: password },
  });
  const workspace = await prisma.workspace.create({ data: { name: "Matrix Team" } });
  await prisma.membership.create({ data: { role: "admin", userId: admin.id, workspaceId: workspace.id } });
}

main().finally(() => prisma.$disconnect());


