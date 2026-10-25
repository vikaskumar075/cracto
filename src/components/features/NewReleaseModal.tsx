"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { X, Plus } from "lucide-react";
import { CREATE_RELEASE, GET_RELEASES } from "@/graphql/queries";
import { Release } from "@/types";

interface NewReleaseModalProps {
  onClose: () => void;
  onCreated: (release: Release) => void;
}

export function NewReleaseModal({ onClose, onCreated }: NewReleaseModalProps) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [createRelease, { loading }] = useMutation<{ createRelease: Release }>(CREATE_RELEASE, {
    refetchQueries: [{ query: GET_RELEASES }],
    onCompleted: (data) => {
      onCreated(data.createRelease);
      onClose();
    },
  });

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Release name is required";
    if (!date) e.date = "Date is required";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    try {
      await createRelease({
        variables: {
          name: name.trim(),
          date: new Date(date).toISOString(),
          additionalInfo: additionalInfo.trim() || undefined,
        },
      });
    } catch {
      setErrors({ submit: "Failed to create release. Please try again." });
    }
  }

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
            New release
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

        <form onSubmit={handleSubmit} style={{ padding: "20px" }}>
          {errors.submit && (
            <p
              style={{
                color: "#dc2626",
                fontSize: "13px",
                marginBottom: "12px",
                padding: "8px 12px",
                background: "#fef2f2",
                borderRadius: "4px",
                border: "1px solid #fee2e2",
              }}
            >
              {errors.submit}
            </p>
          )}

          <div style={{ marginBottom: "14px" }}>
            <label className="form-label" htmlFor="release-name">
              Release name <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              id="release-name"
              className="form-input"
              type="text"
              placeholder="e.g. Version 2.0.0"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            {errors.name && (
              <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px" }}>
                {errors.name}
              </p>
            )}
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label className="form-label" htmlFor="release-date">
              Due date <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              id="release-date"
              className="form-input"
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            {errors.date && (
              <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px" }}>
                {errors.date}
              </p>
            )}
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label className="form-label" htmlFor="release-info">
              Additional information{" "}
              <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              id="release-info"
              className="form-input"
              placeholder="Any notes or context for this release..."
              rows={3}
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              style={{ resize: "vertical" }}
            />
          </div>

          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Plus size={14} />
              {loading ? "Creating…" : "Create release"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
