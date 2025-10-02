import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "~/lib/auth";

export default async function Workspace() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  return (
    <div className="max-w-4xl mx-auto py-12">
      <h1 className="text-4xl font-bold mb-6">Workspace</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Welcome!</h2>
        <p className="text-gray-700 mb-2">
          Email: <strong>{session.user?.email}</strong>
        </p>
        <p className="text-gray-700">
          This is a protected page. Only authenticated users can access this
          content.
        </p>
      </div>
    </div>
  );
}
