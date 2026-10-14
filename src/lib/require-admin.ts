import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Untuk Server Component / Layout — pakai redirect()
export async function requireAdmin() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = session.user;
  if (user.role !== "ADMIN") redirect("/dashboard");

  return user;
}

// Untuk API Route Handler — return status code, bukan redirect()
type AdminCheckResult =
  | { ok: true; user: { id: string; name: string; role: string; status: string } }
  | { ok: false; status: 401 | 403; error: string };

export async function requireAdminApi(): Promise<AdminCheckResult> {
  const session = await auth();
  if (!session) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const user = session.user as
    | { id?: string; name?: string; role?: string; status?: string }
    | undefined;

  if (!user || user.role !== "ADMIN" || user.status !== "APPROVED") {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return {
    ok: true,
    user: {
      id: user.id || "",
      name: user.name || "",
      role: user.role,
      status: user.status,
    },
  };
}