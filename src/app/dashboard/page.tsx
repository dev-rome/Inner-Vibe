import { signout } from "../(auth)/actions";

export default function Dashboard() {
  return (
    <main className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium">Dashboard</h1>
        <form action={signout}>
          <button
            type="submit"
            className="rounded-md border px-3 py-1.5 text-sm"
          >
            Log out
          </button>
        </form>
      </div>
    </main>
  );
}
