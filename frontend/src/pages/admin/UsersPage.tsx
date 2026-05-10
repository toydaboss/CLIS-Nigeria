import { AdminLayout } from "@/components/AdminLayout";
import {
  AdminUser,
  createUser,
  deleteUser,
  fetchUsers,
  updateUserRole,
} from "@/lib/api";
import { getUser } from "@/lib/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

const STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT Abuja",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

const BLANK_FORM = {
  email: "",
  name: "",
  role: "registrar",
  jurisdictionState: "",
  password: "",
};

function RoleBadge({ role }: { role: string }) {
  return role === "admin" ? (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: 999,
        background: "var(--c-blue-900)",
        color: "#fff",
        letterSpacing: "0.05em",
      }}
    >
      ADMIN
    </span>
  ) : (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: 999,
        background: "var(--c-ink-100)",
        color: "var(--c-ink-800)",
        letterSpacing: "0.05em",
      }}
    >
      REGISTRAR
    </span>
  );
}

export function UsersPage() {
  const qc = useQueryClient();
  const self = getUser();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [formErr, setFormErr] = useState("");
  const [totpInfo, setTotpInfo] = useState<{
    secret: string;
    uri: string;
    name: string;
  } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("registrar");
  const [editState, setEditState] = useState("");

  const { data: users = [], isFetching } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const createMut = useMutation({
    mutationFn: createUser,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setTotpInfo({
        secret: res.totpSecret,
        uri: res.totpUri,
        name: res.user.name,
      });
      setForm(BLANK_FORM);
      setShowForm(false);
      setFormErr("");
    },
    onError: (e: any) =>
      setFormErr(e.response?.data?.error ?? "Failed to create user"),
  });

  const roleMut = useMutation({
    mutationFn: ({
      id,
      role,
      state,
    }: {
      id: string;
      role: string;
      state: string;
    }) => updateUserRole(id, role, state || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setEditingId(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  const handleCreate = () => {
    if (!form.email || !form.name || !form.password) {
      setFormErr("All fields are required.");
      return;
    }
    if (form.role === "registrar" && !form.jurisdictionState) {
      setFormErr("Select a jurisdiction for registrar.");
      return;
    }
    setFormErr("");
    createMut.mutate(form);
  };

  const handleEditSave = (id: string) => {
    roleMut.mutate({ id, role: editRole, state: editState });
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });

  return (
    <AdminLayout active="Users & Roles">
      <div className="page-pad">
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 24,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 4,
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--c-ink-500)"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
              <div className="t-micro">Administrator access only</div>
            </div>
            <h1 className="t-h1">Users &amp; Roles</h1>
            <div className="t-body muted" style={{ marginTop: 4 }}>
              Manage registrar and administrator accounts.
            </div>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setShowForm((s) => !s);
              setFormErr("");
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M12 4v16m-8-8h16" />
            </svg>
            {showForm ? "Cancel" : "Invite user"}
          </button>
        </div>

        {/* Invite form */}
        {showForm && (
          <div
            className="card card-pad-md"
            style={{
              marginBottom: 20,
              background: "var(--c-ink-50)",
              border: "1px solid var(--c-ink-200)",
            }}
          >
            <div className="t-h3" style={{ marginBottom: 16 }}>
              New user account
            </div>
            <div className="grid-2" style={{ gap: 14 }}>
              <div>
                <label className="field-label" style={{ marginBottom: 6 }}>
                  Full name
                </label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. Aisha Bello"
                  style={{ height: 38 }}
                />
              </div>
              <div>
                <label className="field-label" style={{ marginBottom: 6 }}>
                  Email
                </label>
                <input
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="user@state.gov.ng"
                  style={{ height: 38 }}
                />
              </div>
              <div>
                <label className="field-label" style={{ marginBottom: 6 }}>
                  Role
                </label>
                <select
                  className="input select"
                  value={form.role}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      role: e.target.value,
                      jurisdictionState: "",
                    }))
                  }
                  style={{ height: 38 }}
                >
                  <option value="registrar">Registrar</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              {form.role === "registrar" && (
                <div>
                  <label className="field-label" style={{ marginBottom: 6 }}>
                    Jurisdiction (state)
                  </label>
                  <select
                    className="input select"
                    value={form.jurisdictionState}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        jurisdictionState: e.target.value,
                      }))
                    }
                    style={{ height: 38 }}
                  >
                    <option value="">— Select state —</option>
                    {STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="field-label" style={{ marginBottom: 6 }}>
                  Temporary password
                </label>
                <input
                  className="input"
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  placeholder="Min 8 characters"
                  style={{ height: 38 }}
                />
              </div>
            </div>
            {formErr && (
              <div
                style={{
                  marginTop: 12,
                  fontSize: 13,
                  color: "var(--c-danger-600)",
                }}
              >
                {formErr}
              </div>
            )}
            <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
              <button
                className="btn btn-primary btn-sm"
                disabled={createMut.isPending}
                onClick={handleCreate}
              >
                {createMut.isPending ? "Creating…" : "Create account"}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setShowForm(false);
                  setFormErr("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* TOTP info panel */}
        {totpInfo && (
          <div
            className="card card-pad-md"
            style={{
              marginBottom: 20,
              borderLeft: "4px solid var(--c-gold-500)",
              background: "var(--c-warning-50)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <div className="t-h3" style={{ marginBottom: 6 }}>
                  Account created — share TOTP details with {totpInfo.name}
                </div>
                <div className="t-small muted" style={{ marginBottom: 12 }}>
                  This secret is shown only once. The user must add it to their
                  authenticator app before logging in.
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--c-ink-600)",
                        minWidth: 80,
                      }}
                    >
                      Secret
                    </span>
                    <code
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        letterSpacing: "0.1em",
                        background: "var(--c-card)",
                        padding: "3px 10px",
                        borderRadius: 4,
                        border: "1px solid var(--c-ink-200)",
                      }}
                    >
                      {totpInfo.secret}
                    </code>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--c-ink-600)",
                        minWidth: 80,
                        paddingTop: 2,
                      }}
                    >
                      OTP URI
                    </span>
                    <code
                      style={{
                        fontSize: 11,
                        wordBreak: "break-all",
                        background: "var(--c-card)",
                        padding: "4px 10px",
                        borderRadius: 4,
                        border: "1px solid var(--c-ink-200)",
                        flex: 1,
                      }}
                    >
                      {totpInfo.uri}
                    </code>
                  </div>
                </div>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setTotpInfo(null)}
                style={{ flexShrink: 0 }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Users table */}
        <div className="card">
          <div className="table-wrap"></div>
          <table className="dtable">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th style={{ width: 110 }}>Role</th>
                <th>Jurisdiction</th>
                <th style={{ width: 130 }}>User code</th>
                <th style={{ width: 110 }}>Joined</th>
                <th style={{ width: 160 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isFetching ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: 40,
                      color: "var(--c-ink-500)",
                    }}
                  >
                    Loading…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: 40,
                      color: "var(--c-ink-500)",
                    }}
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u: AdminUser) => (
                  <>
                    <tr
                      key={u._id}
                      style={{
                        background:
                          editingId === u._id ? "var(--c-ink-50)" : undefined,
                      }}
                    >
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: "50%",
                              flexShrink: 0,
                              background:
                                u.role === "admin"
                                  ? "var(--c-blue-900)"
                                  : "var(--c-gold-500)",
                              color:
                                u.role === "admin"
                                  ? "#fff"
                                  : "var(--c-blue-900)",
                              display: "grid",
                              placeItems: "center",
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            {u.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 600, fontSize: 14 }}>
                            {u.name}
                          </span>
                          {u._id === self?.userCode && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: "1px 6px",
                                borderRadius: 999,
                                background: "var(--c-ink-200)",
                                color: "var(--c-ink-700)",
                              }}
                            >
                              YOU
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="t-mono" style={{ fontSize: 12 }}>
                          {u.email}
                        </span>
                      </td>
                      <td>
                        <RoleBadge role={u.role} />
                      </td>
                      <td style={{ fontSize: 13 }}>
                        {u.jurisdictionState ?? (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td>
                        <span className="t-mono" style={{ fontSize: 12 }}>
                          {u.userCode}
                        </span>
                      </td>
                      <td style={{ fontSize: 13 }}>{fmtDate(u.createdAt)}</td>
                      <td>
                        {u._id !== self?.id && (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: 11, padding: "3px 10px" }}
                              onClick={() => {
                                setEditingId(
                                  editingId === u._id ? null : u._id,
                                );
                                setEditRole(u.role);
                                setEditState(u.jurisdictionState ?? "");
                              }}
                            >
                              {editingId === u._id ? "Cancel" : "Edit role"}
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{
                                fontSize: 11,
                                padding: "3px 10px",
                                color: "var(--c-danger-600)",
                              }}
                              disabled={deleteMut.isPending}
                              onClick={() => {
                                if (
                                  confirm(
                                    `Remove ${u.name}? This cannot be undone.`,
                                  )
                                )
                                  deleteMut.mutate(u._id);
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* Inline role editor */}
                    {editingId === u._id && (
                      <tr
                        key={`${u._id}-edit`}
                        style={{ background: "var(--c-blue-50)" }}
                      >
                        <td colSpan={7} style={{ padding: "12px 20px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              flexWrap: "wrap",
                            }}
                          >
                            <select
                              className="input select"
                              value={editRole}
                              onChange={(e) => {
                                setEditRole(e.target.value);
                                setEditState("");
                              }}
                              style={{ height: 34, fontSize: 13, width: 150 }}
                            >
                              <option value="registrar">Registrar</option>
                              <option value="admin">Administrator</option>
                            </select>
                            {editRole === "registrar" && (
                              <select
                                className="input select"
                                value={editState}
                                onChange={(e) => setEditState(e.target.value)}
                                style={{ height: 34, fontSize: 13, width: 200 }}
                              >
                                <option value="">— Select state —</option>
                                {STATES.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            )}
                            <button
                              className="btn btn-primary btn-sm"
                              disabled={
                                roleMut.isPending ||
                                (editRole === "registrar" && !editState)
                              }
                              onClick={() => handleEditSave(u._id)}
                            >
                              {roleMut.isPending ? "Saving…" : "Save"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid var(--c-ink-100)",
            background: "var(--c-ink-50)",
            fontSize: 13,
            color: "var(--c-ink-600)",
          }}
        >
          {users.length} user{users.length !== 1 ? "s" : ""} total ·{" "}
          {users.filter((u: AdminUser) => u.role === "admin").length}{" "}
          administrator
          {users.filter((u: AdminUser) => u.role === "admin").length !== 1
            ? "s"
            : ""}{" "}
          · {users.filter((u: AdminUser) => u.role === "registrar").length}{" "}
          registrar
          {users.filter((u: AdminUser) => u.role === "registrar").length !== 1
            ? "s"
            : ""}
        </div>
      </div>
    </AdminLayout>
  );
}
