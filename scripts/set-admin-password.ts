// Membuat admin bila belum ada, atau mengganti hash sandinya bila sudah ada.
// Aman dijalankan berulang kali; tidak menghapus baris dan tidak mencetak sandi.
//
//   ADMIN_INITIAL_PASSWORD=... DATABASE_URL=... \
//   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/set-admin-password.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const ADMIN_EMAIL = "admin@naskah.id";

const prisma = new PrismaClient();

async function main() {
  const newPassword = process.env.ADMIN_INITIAL_PASSWORD;
  if (!newPassword || newPassword.length < 12) {
    throw new Error("Set ADMIN_INITIAL_PASSWORD (minimal 12 karakter)");
  }
  const password = await bcrypt.hash(newPassword, 10);

  const existing = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
    select: { id: true, role: true, status: true },
  });

  if (!existing) {
    const admin = await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        name: "Admin Utama",
        password,
        role: "ADMIN",
        status: "APPROVED",
      },
      select: { id: true },
    });
    console.log(`Admin dibuat: ${ADMIN_EMAIL} (id ${admin.id})`);
    return;
  }

  if (existing.role !== "ADMIN" || existing.status !== "APPROVED") {
    throw new Error(
      `${ADMIN_EMAIL} sudah ada tetapi role/status-nya ${existing.role}/${existing.status}; sandi tidak diubah`
    );
  }

  await prisma.user.update({
    where: { email: ADMIN_EMAIL },
    data: { password },
    select: { id: true },
  });
  console.log(`Sandi admin diperbarui: ${ADMIN_EMAIL} (id ${existing.id})`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
