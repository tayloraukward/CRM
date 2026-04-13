import { FormEvent, useCallback, useEffect, useState } from "react";
import { apiFetch, parseError } from "../api";
import { Drawer } from "../components/Drawer";
import type { Contact, Organization } from "../types";

type PanelMode = "none" | "create" | "edit";

export function ContactsPage() {
  const [rows, setRows] = useState<Contact[] | null>(null);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [panel, setPanel] = useState<PanelMode>("none");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [organizationId, setOrganizationId] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setOrganizationId("");
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

  const openEdit = useCallback(
    (c: Contact) => {
      setFormError(null);
      setEditingId(c.id);
      setFirstName(c.first_name);
      setLastName(c.last_name);
      setEmail(c.email ?? "");
      setPhone(c.phone ?? "");
      setOrganizationId(c.organization_id != null ? String(c.organization_id) : "");
      setPanel("edit");
    },
    [],
  );

  const loadContacts = useCallback(async () => {
    const res = await apiFetch("/contacts");
    if (!res.ok) {
      setListError(await parseError(res));
      setRows([]);
      return;
    }
    setListError(null);
    setRows((await res.json()) as Contact[]);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setListError(null);
      const [cRes, oRes] = await Promise.all([
        apiFetch("/contacts"),
        apiFetch("/organizations"),
      ]);
      if (cancelled) return;
      if (!cRes.ok) {
        setListError(await parseError(cRes));
        setRows([]);
      } else {
        setRows((await cRes.json()) as Contact[]);
      }
      if (oRes.ok) {
        setOrgs((await oRes.json()) as Organization[]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function buildBody() {
    return {
      first_name: firstName,
      last_name: lastName,
      email: email.trim() ? email.trim() : null,
      phone: phone.trim() ? phone.trim() : null,
      organization_id: organizationId ? Number(organizationId) : null,
    };
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    const res = await apiFetch("/contacts", {
      method: "POST",
      body: JSON.stringify(buildBody()),
    });
    if (!res.ok) {
      setFormError(await parseError(res));
      setSubmitting(false);
      return;
    }
    await loadContacts();
    closePanel();
    setSubmitting(false);
  }

  async function onUpdate(e: FormEvent) {
    e.preventDefault();
    if (editingId == null) return;
    setFormError(null);
    setSubmitting(true);
    const res = await apiFetch(`/contacts/${editingId}`, {
      method: "PATCH",
      body: JSON.stringify(buildBody()),
    });
    if (!res.ok) {
      setFormError(await parseError(res));
      setSubmitting(false);
      return;
    }
    const updated = (await res.json()) as Contact;
    await loadContacts();
    openEdit(updated);
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div>
        <h1>Contacts</h1>
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
        <h1 style={{ margin: 0 }}>Contacts</h1>
        <button type="button" className="btn" data-testid="add-contact-button" onClick={openCreate}>
          Add contact
        </button>
      </div>

      <Drawer
        open={showForm}
        title={panel === "create" ? "New contact" : "Edit contact"}
        onClose={closePanel}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              data-testid="contact-cancel"
              disabled={submitting}
              onClick={closePanel}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="contact-form"
              className="btn"
              disabled={submitting}
              data-testid="contact-submit"
            >
              {submitting
                ? "Saving…"
                : panel === "create"
                  ? "Create contact"
                  : "Save changes"}
            </button>
          </>
        }
      >
        {formError ? <div className="error-banner">{formError}</div> : null}
        <form
          id="contact-form"
          onSubmit={(e) => void (panel === "create" ? onCreate(e) : onUpdate(e))}
        >
          <div className="grid2">
            <div className="field">
              <label htmlFor="first_name">First name</label>
              <input
                id="first_name"
                data-testid="contact-first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="last_name">Last name</label>
              <input
                id="last_name"
                data-testid="contact-last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                data-testid="contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                data-testid="contact-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="organization_id">Organization</label>
              <select
                id="organization_id"
                data-testid="contact-organization"
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
              >
                <option value="">None</option>
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </form>
      </Drawer>

      {listError ? <div className="error-banner">{listError}</div> : null}
      {!rows?.length && !listError ? (
        <p className="muted">No contacts yet.</p>
      ) : null}
      {rows && rows.length > 0 ? (
        <table data-testid="contacts-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Org ID</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr
                key={c.id}
                data-testid={`contact-row-${c.id}`}
                onClick={() => openEdit(c)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openEdit(c);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Edit contact ${c.first_name} ${c.last_name}`}
                style={{
                  cursor: "pointer",
                  background:
                    panel === "edit" && editingId === c.id ? "#eff6ff" : undefined,
                }}
              >
                <td>{c.id}</td>
                <td>
                  {c.first_name} {c.last_name}
                </td>
                <td>{c.email ?? "—"}</td>
                <td>{c.phone ?? "—"}</td>
                <td>{c.organization_id ?? "—"}</td>
                <td>{new Date(c.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {!showForm && rows && rows.length > 0 ? (
        <p className="muted" style={{ marginTop: "0.75rem" }}>
          Click a row to edit a contact.
        </p>
      ) : null}
    </div>
  );
}
