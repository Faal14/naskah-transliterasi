import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("admin123", 10);

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
  console.log("   Password: admin123");
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