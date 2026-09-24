import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = session.user as any;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        <div className="space-y-3 text-sm mb-8">
          <p>
            <span className="font-medium text-gray-600">Nama:</span> {user.name}
          </p>
          <p>
            <span className="font-medium text-gray-600">Email:</span>{" "}
            {user.email}
          </p>
          <p>
            <span className="font-medium text-gray-600">Role:</span>{" "}
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
              {user.role}
            </span>
          </p>
          <p>
            <span className="font-medium text-gray-600">Status:</span>{" "}
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                user.status === "APPROVED"
                  ? "bg-green-100 text-green-700"
                  : user.status === "PENDING"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
              }`}
            >
              {user.status}
            </span>
          </p>
        </div>

        {user.status === "PENDING" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-sm text-yellow-800">
            ⏳ Akun kamu masih menunggu verifikasi admin. Setelah diverifikasi,
            kamu bisa mulai menerjemahkan naskah.
          </div>
        )}

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Keluar
          </button>
        </form>
      </div>
    </div>
  );
}