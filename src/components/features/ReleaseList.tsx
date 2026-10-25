"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { Plus, Eye, Trash2 } from "lucide-react";
import { GET_RELEASES } from "@/graphql/queries";
import { Release } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { NewReleaseModal } from "@/components/features/NewReleaseModal";
import { DeleteReleaseModal } from "@/components/features/DeleteReleaseModal";
import { format } from "date-fns";

interface ReleaseListProps {
  onSelectRelease: (release: Release) => void;
}

export function ReleaseList({ onSelectRelease }: ReleaseListProps) {
  const { data, loading, error } = useQuery<{ releases: Release[] }>(GET_RELEASES);
  const [showNewModal, setShowNewModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Release | null>(null);

  const releases: Release[] = data?.releases ?? [];

  return (
    <div>
      {/* Header toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "4px",
            padding: "5px 14px",
            fontSize: "13px",
            color: "#374151",
            fontWeight: 500,
          }}
        >
          All releases
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowNewModal(true)}
        >
          <Plus size={14} />
          New release
        </button>
      </div>

      {/* Releases table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: "24px" }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "16px",
                  marginBottom: "12px",
                  alignItems: "center",
                }}
              >
                <div className="skeleton" style={{ height: 16, flex: 3 }} />
                <div className="skeleton" style={{ height: 16, flex: 2 }} />
                <div className="skeleton" style={{ height: 20, width: 64 }} />
                <div className="skeleton" style={{ height: 28, width: 80 }} />
              </div>
            ))}
          </div>
        ) : error ? (
          <div
            style={{
              padding: "32px",
              textAlign: "center",
              color: "#dc2626",
              fontSize: "13px",
            }}
          >
            Failed to load releases. Check your database connection.
          </div>
        ) : releases.length === 0 ? (
          <div
            style={{
              padding: "48px 24px",
              textAlign: "center",
              color: "#9ca3af",
              fontSize: "13px",
            }}
          >
            <p style={{ marginBottom: "8px", fontSize: "15px", color: "#6b7280" }}>
              No releases yet
            </p>
            <p>Create your first release to get started.</p>
          </div>
        ) : (
          <table className="table-container">
            <thead>
              <tr>
                <th>Release</th>
                <th>Date</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {releases.map((release) => (
                <tr key={release.id}>
                  <td style={{ fontWeight: 500 }}>{release.name}</td>
                  <td style={{ color: "#6b7280" }}>
                    {format(new Date(release.date), "MMMM d, yyyy")}
                  </td>
                  <td>
                    <StatusBadge status={release.status} />
                  </td>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        gap: "6px",
                        justifyContent: "flex-end",
                        alignItems: "center",
                      }}
                    >
                      <button
                        className="btn btn-ghost"
                        onClick={() => onSelectRelease(release)}
                        style={{ padding: "4px 10px" }}
                      >
                        View
                      </button>
                      <button
                        title="View release"
                        onClick={() => onSelectRelease(release)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#6b7280",
                          padding: "4px",
                          display: "flex",
                          alignItems: "center",
                        }}
                        aria-label="View"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        title="Delete release"
                        onClick={() => setDeleteTarget(release)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#9ca3af",
                          padding: "4px",
                          display: "flex",
                          alignItems: "center",
                        }}
                        aria-label="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showNewModal && (
        <NewReleaseModal
          onClose={() => setShowNewModal(false)}
          onCreated={(release) => onSelectRelease(release)}
        />
      )}

      {deleteTarget && (
        <DeleteReleaseModal
          releaseId={deleteTarget.id}
          releaseName={deleteTarget.name}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
