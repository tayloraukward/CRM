import { FormEvent, useCallback, useEffect, useState } from "react";
import { apiFetch, parseError } from "../api";
import { Drawer } from "../components/Drawer";
import type { Contact, Deal, Organization } from "../types";

type PanelMode = "none" | "create" | "edit";

export function DealsPage() {
  const [rows, setRows] = useState<Deal[] | null>(null);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [panel, setPanel] = useState<PanelMode>("none");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [stage, setStage] = useState("");
  const [organizationId, setOrganizationId] = useState<string>("");
  const [contactId, setContactId] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setTitle("");
    setAmount("");
    setStage("");
    setOrganizationId("");
    setContactId("");
    setFormError(null);
    setEditingId(null);
  }, []);

  const closePanel = useCallback(() => {
    setPanel("none");
    resetForm();
  }, [resetForm]);

  const openCreate = useCallback(() => {
    resetForm();
    setStage("prospecting");
    setPanel("create");
  }, [resetForm]);

  const openEdit = useCallback((d: Deal) => {
    setFormError(null);
    setEditingId(d.id);
    setTitle(d.title);
    setAmount(String(d.amount));
    setStage(d.stage);
    setOrganizationId(d.organization_id != null ? String(d.organization_id) : "");
    setContactId(d.contact_id != null ? String(d.contact_id) : "");
    setPanel("edit");
  }, []);

  const loadRows = useCallback(async () => {
    const res = await apiFetch("/deals");
    if (!res.ok) {
      setListError(await parseError(res));
      setRows([]);
      return;
    }
    setListError(null);
    setRows((await res.json()) as Deal[]);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setListError(null);
      const [dRes, oRes, cRes] = await Promise.all([
        apiFetch("/deals"),
        apiFetch("/organizations"),
        apiFetch("/contacts"),
      ]);
      if (cancelled) return;
      if (!dRes.ok) {
        setListError(await parseError(dRes));
        setRows([]);
      } else {
        setRows((await dRes.json()) as Deal[]);
      }
      if (oRes.ok) {
        setOrgs((await oRes.json()) as Organization[]);
      }
      if (cRes.ok) {
        setContacts((await cRes.json()) as Contact[]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function buildBody() {
    const amt = amount.trim() === "" ? 0 : Number(amount);
    return {
      title: title.trim(),
      amount: amt,
      stage: stage.trim(),
      organization_id: organizationId ? Number(organizationId) : null,
      contact_id: contactId ? Number(contactId) : null,
    };
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    const res = await apiFetch("/deals", {
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
    const res = await apiFetch(`/deals/${editingId}`, {
      method: "PATCH",
      body: JSON.stringify(buildBody()),
    });
    if (!res.ok) {
      setFormError(await parseError(res));
      setSubmitting(false);
      return;
    }
    const updated = (await res.json()) as Deal;
    await loadRows();
    openEdit(updated);
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div>
        <h1>Deals</h1>
        <p className="muted">Loading…</p>
      </div>
    );
  }

  const showForm = panel !== "none";
  const stageOptions = [
    "prospecting",
    "qualification",
    "proposal",
    "negotiation",
    "closed_won",
    "closed_lost",
  ];

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
        <h1 style={{ margin: 0 }}>Deals</h1>
        <button type="button" className="btn" data-testid="add-deal-button" onClick={openCreate}>
          Add deal
        </button>
      </div>

      <Drawer
        open={showForm}
        title={panel === "create" ? "New deal" : "Edit deal"}
        onClose={closePanel}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              data-testid="deal-cancel"
              disabled={submitting}
              onClick={closePanel}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="deal-form"
              className="btn"
              disabled={submitting}
              data-testid="deal-submit"
            >
              {submitting
                ? "Saving…"
                : panel === "create"
                  ? "Create deal"
                  : "Save changes"}
            </button>
          </>
        }
      >
        {formError ? <div className="error-banner">{formError}</div> : null}
        <form
          id="deal-form"
          onSubmit={(e) => void (panel === "create" ? onCreate(e) : onUpdate(e))}
        >
          <div className="grid2">
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="deal_title">Title</label>
              <input
                id="deal_title"
                data-testid="deal-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="deal_amount">Amount</label>
              <input
                id="deal_amount"
                data-testid="deal-amount"
                inputMode="decimal"
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="deal_stage">Stage</label>
              <select
                id="deal_stage"
                data-testid="deal-stage"
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                required
              >
                <option value="" disabled>
                  Select stage…
                </option>
                {stageOptions.map((s) => (
                  <option key={s} value={s}>
                    {s.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="deal_organization_id">Organization</label>
              <select
                id="deal_organization_id"
                data-testid="deal-organization"
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
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="deal_contact_id">Contact</label>
              <select
                id="deal_contact_id"
                data-testid="deal-contact"
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
              >
                <option value="">None</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                    {c.email ? ` (${c.email})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </form>
      </Drawer>

      {listError ? <div className="error-banner">{listError}</div> : null}
      {!rows?.length && !listError ? <p className="muted">No deals yet.</p> : null}
      {rows && rows.length > 0 ? (
        <table data-testid="deals-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Amount</th>
              <th>Stage</th>
              <th>Org ID</th>
              <th>Contact ID</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr
                key={d.id}
                data-testid={`deal-row-${d.id}`}
                onClick={() => openEdit(d)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openEdit(d);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Edit deal ${d.title}`}
                style={{
                  cursor: "pointer",
                  background:
                    panel === "edit" && editingId === d.id ? "#eff6ff" : undefined,
                }}
              >
                <td>{d.id}</td>
                <td>{d.title}</td>
                <td>{d.amount}</td>
                <td>{d.stage}</td>
                <td>{d.organization_id ?? "—"}</td>
                <td>{d.contact_id ?? "—"}</td>
                <td>{new Date(d.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {!showForm && rows && rows.length > 0 ? (
        <p className="muted" style={{ marginTop: "0.75rem" }}>
          Click a row to edit a deal.
        </p>
      ) : null}
    </div>
  );
}
