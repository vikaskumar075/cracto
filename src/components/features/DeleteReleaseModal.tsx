"use client";

import { useMutation } from "@apollo/client/react";
import { Trash2, X } from "lucide-react";
import { DELETE_RELEASE, GET_RELEASES } from "@/graphql/queries";

interface DeleteReleaseModalProps {
  releaseId: string;
  releaseName: string;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteReleaseModal({
  releaseId,
  releaseName,
  onClose,
  onDeleted,
}: DeleteReleaseModalProps) {
  const [deleteRelease, { loading }] = useMutation<{ deleteRelease: boolean }>(DELETE_RELEASE, {
    variables: { id: releaseId },
    refetchQueries: [{ query: GET_RELEASES }],
    onCompleted: () => {
      onDeleted();
      onClose();
    },
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ fontSize: "15px", fontWeight: 600, margin: 0 }}>
            Delete release
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#6b7280",
              padding: 2,
              display: "flex",
              alignItems: "center",
            }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "20px" }}>
          <p style={{ fontSize: "14px", color: "#374151", marginBottom: "20px" }}>
            Are you sure you want to delete{" "}
            <strong>&ldquo;{releaseName}&rdquo;</strong>? This action cannot be
            undone.
          </p>

          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={loading}
              onClick={() => deleteRelease()}
            >
              <Trash2 size={14} />
              {loading ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
