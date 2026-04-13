import { FormEvent, useCallback, useEffect, useState } from "react";
import { apiFetch, parseError } from "../api";
import { Drawer } from "../components/Drawer";
import type { Organization } from "../types";

type PanelMode = "none" | "create" | "edit";

export function OrganizationsPage() {
  const [rows, setRows] = useState<Organization[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [panel, setPanel] = useState<PanelMode>("none");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setName("");
    setWebsite("");
    setFormError(null);
    setEditingId(null);
  }, []);

  const closePanel = useCallback(() => {
    setPanel("none");
    resetForm();
  }, [resetForm]);

  const openCreate = useCallback(() => {
    resetForm();
    setPanel("create");
  }, [resetForm]);

  const openEdit = useCallback((o: Organization) => {
    setFormError(null);
    setEditingId(o.id);
    setName(o.name);
    setWebsite(o.website ?? "");
    setPanel("edit");
  }, []);

  const loadRows = useCallback(async () => {
    const res = await apiFetch("/organizations");
    if (!res.ok) {
      setListError(await parseError(res));
      setRows([]);
      return;
    }
    setListError(null);
    setRows((await res.json()) as Organization[]);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setListError(null);
      const res = await apiFetch("/organizations");
      if (cancelled) return;
      if (!res.ok) {
        setListError(await parseError(res));
        setRows([]);
      } else {
        setRows((await res.json()) as Organization[]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function buildBody() {
    return {
      name: name.trim(),
      website: website.trim() ? website.trim() : null,
    };
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    const res = await apiFetch("/organizations", {
      method: "POST",
      body: JSON.stringify(buildBody()),
    });
    if (!res.ok) {
      setFormError(await parseError(res));
      setSubmitting(false);
      return;
    }
    await loadRows();
    closePanel();
    setSubmitting(false);
  }

  async function onUpdate(e: FormEvent) {
    e.preventDefault();
    if (editingId == null) return;
    setFormError(null);
    setSubmitting(true);
    const res = await apiFetch(`/organizations/${editingId}`, {
      method: "PATCH",
      body: JSON.stringify(buildBody()),
    });
    if (!res.ok) {
      setFormError(await parseError(res));
      setSubmitting(false);
      return;
    }
    const updated = (await res.json()) as Organization;
    await loadRows();
    openEdit(updated);
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div>
        <h1>Organizations</h1>
        <p className="muted">Loading…</p>
      </div>
    );
  }

  const showForm = panel !== "none";

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
          marginBottom: "1rem",
        }}
      >
        <h1 style={{ margin: 0 }}>Organizations</h1>
        <button type="button" className="btn" data-testid="add-organization-button" onClick={openCreate}>
          Add organization
        </button>
      </div>

      <Drawer
        open={showForm}
        title={panel === "create" ? "New organization" : "Edit organization"}
        onClose={closePanel}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              data-testid="organization-cancel"
              disabled={submitting}
              onClick={closePanel}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="organization-form"
              className="btn"
              disabled={submitting}
              data-testid="organization-submit"
            >
              {submitting
                ? "Saving…"
                : panel === "create"
                  ? "Create organization"
                  : "Save changes"}
            </button>
          </>
        }
      >
        {formError ? <div className="error-banner">{formError}</div> : null}
        <form
          id="organization-form"
          onSubmit={(e) => void (panel === "create" ? onCreate(e) : onUpdate(e))}
        >
          <div className="field">
            <label htmlFor="org_name">Name</label>
            <input
              id="org_name"
              data-testid="organization-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="org_website">Website</label>
            <input
              id="org_website"
              data-testid="organization-website"
              type="text"
              placeholder="https://example.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>
        </form>
      </Drawer>

      {listError ? <div className="error-banner">{listError}</div> : null}
      {!rows?.length && !listError ? (
        <p className="muted">No organizations yet.</p>
      ) : null}
      {rows && rows.length > 0 ? (
        <table data-testid="organizations-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Website</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr
                key={o.id}
                data-testid={`organization-row-${o.id}`}
                onClick={() => openEdit(o)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openEdit(o);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Edit organization ${o.name}`}
                style={{
                  cursor: "pointer",
                  background:
                    panel === "edit" && editingId === o.id ? "#eff6ff" : undefined,
                }}
              >
                <td>{o.id}</td>
                <td>{o.name}</td>
                <td>{o.website ?? "—"}</td>
                <td>{new Date(o.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {!showForm && rows && rows.length > 0 ? (
        <p className="muted" style={{ marginTop: "0.75rem" }}>
          Click a row to edit an organization.
        </p>
      ) : null}
    </div>
  );
}
