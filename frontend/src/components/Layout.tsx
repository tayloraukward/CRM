import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          background: "#111827",
          color: "#f9fafb",
          padding: "0.75rem 1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "1.5rem",
          flexWrap: "wrap",
        }}
      >
        <strong style={{ marginRight: "auto" }}>CRM</strong>
        <nav style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <NavLink
            to="/organizations"
            style={({ isActive }) => ({
              color: isActive ? "#93c5fd" : "#e5e7eb",
            })}
          >
            Organizations
          </NavLink>
          <NavLink
            to="/contacts"
            style={({ isActive }) => ({
              color: isActive ? "#93c5fd" : "#e5e7eb",
            })}
          >
            Contacts
          </NavLink>
          <NavLink
            to="/deals"
            style={({ isActive }) => ({
              color: isActive ? "#93c5fd" : "#e5e7eb",
            })}
          >
            Deals
          </NavLink>
        </nav>
        <span className="muted" style={{ color: "#9ca3af" }}>
          {user?.username}
        </span>
        <button
          type="button"
          className="btn btn-secondary"
          data-testid="logout-button"
          onClick={() => void logout()}
        >
          Log out
        </button>
      </header>
      <main style={{ padding: "1.5rem", maxWidth: 1100, margin: "0 auto", width: "100%" }}>
        <Outlet />
      </main>
    </div>
  );
}
