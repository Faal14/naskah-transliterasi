import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD;
  if (!initialPassword || initialPassword.length < 12) {
    throw new Error("Set ADMIN_INITIAL_PASSWORD (minimal 12 karakter)");
  }
  const password = await bcrypt.hash(initialPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@naskah.id" },
    update: {},
    create: {
      email: "admin@naskah.id",
      name: "Admin Utama",
      password,
      role: "ADMIN",
      status: "APPROVED",
    },
  });

  console.log("✅ Admin dibuat:");
  console.log("   Email:    admin@naskah.id");
  console.log("   ID:", admin.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });