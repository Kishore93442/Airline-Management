import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { Moon, Sun, LogOut } from "lucide-react";

export default function Dashboard() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100 p-6 text-slate-900 dark:bg-slate-950 dark:text-white">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AeroOps</h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Airline Operations & Fleet Management
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="rounded-lg border border-slate-300 p-2 dark:border-slate-700"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon /> : <Sun />}
          </button>

          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </header>

      <section className="mb-6">
        <h2 className="text-xl font-semibold">
          Welcome, {user?.first_name || user?.username}
        </h2>

        <p className="text-sm text-slate-500 dark:text-slate-400">
          {user?.department || "AeroOps Team"}
        </p>
      </section>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total Flights", "0"],
          ["Active Aircraft", "0"],
          ["Crew Members", "0"],
          ["Maintenance Alerts", "0"],
        ].map(([title, value]) => (
          <div
            key={title}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {title}
            </p>

            <h3 className="mt-3 text-3xl font-bold">{value}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}
