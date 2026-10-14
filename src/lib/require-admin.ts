import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Layout dan halaman dirender bersamaan, jadi pemeriksaan di admin/layout.tsx saja
// tidak mencegah query halaman berjalan. Panggil ini di awal setiap halaman admin,
// sebelum query apa pun.
export async function requireAdmin() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = session.user;
  if (user.role !== "ADMIN") redirect("/dashboard");

  return user;
}
