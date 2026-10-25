"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { ChevronRight, Trash2, Check, Save } from "lucide-react";
import { GET_RELEASE, UPDATE_RELEASE, GET_RELEASES, DELETE_RELEASE } from "@/graphql/queries";
import { Release } from "@/types";
import { RELEASE_STEPS } from "@/lib/constants";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DeleteReleaseModal } from "@/components/features/DeleteReleaseModal";
import { format } from "date-fns";

interface ReleaseDetailProps {
  releaseId: string;
  onBack: () => void;
}

export function ReleaseDetail({ releaseId, onBack }: ReleaseDetailProps) {
  const { data, loading, error } = useQuery<{ release: Release | null }>(GET_RELEASE, {
    variables: { id: releaseId },
    fetchPolicy: "cache-and-network",
  });

  const [updateRelease, { loading: saving }] = useMutation<{ updateRelease: Release }>(UPDATE_RELEASE);

  const [deleteRelease] = useMutation<{ deleteRelease: boolean }>(DELETE_RELEASE, {
    variables: { id: releaseId },
    refetchQueries: [{ query: GET_RELEASES }],
    onCompleted: onBack,
  });

  const [stepsCompleted, setStepsCompleted] = useState<number[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const release: Release | null = data?.release ?? null;

  useEffect(() => {
    if (release) {
      setStepsCompleted(release.stepsCompleted);
      setAdditionalInfo(release.additionalInfo ?? "");
    }
  }, [release]);

  const handleStepToggle = useCallback(
    (stepId: number) => {
      setStepsCompleted((prev) => {
        const next = prev.includes(stepId)
          ? prev.filter((s) => s !== stepId)
          : [...prev, stepId];

        // Auto-save step changes immediately
        updateRelease({
          variables: { id: releaseId, stepsCompleted: next },
        });

        return next;
      });
    },
    [releaseId, updateRelease]
  );

  const handleSave = async () => {
    await updateRelease({
      variables: {
        id: releaseId,
        additionalInfo: additionalInfo || null,
        stepsCompleted,
      },
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  if (loading && !data) {
    return (
      <div style={{ padding: "24px" }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton" style={{ height: 20, marginBottom: "12px" }} />
        ))}
      </div>
    );
  }

  if (error || !release) {
    return (
      <div style={{ padding: "32px", textAlign: "center", color: "#dc2626" }}>
        Release not found.
      </div>
    );
  }

  const progressPercent =
    stepsCompleted.length === 0
      ? 0
      : Math.round((stepsCompleted.length / RELEASE_STEPS.length) * 100);

  return (
    <div>
      {/* Breadcrumb + Delete */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <button
            onClick={onBack}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              color: "var(--color-indigo)",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            All releases
          </button>
          <ChevronRight size={14} style={{ color: "#9ca3af" }} />
          <span style={{ color: "#374151", fontWeight: 500 }}>{release.name}</span>
        </nav>

        <button
          className="btn btn-danger"
          onClick={() => setShowDeleteModal(true)}
          style={{ padding: "5px 12px", fontSize: "12px" }}
        >
          <Trash2 size={13} />
          Delete
        </button>
      </div>

      {/* Main card */}
      <div className="card">
        {/* Release info header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            gap: "20px",
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          <div style={{ flex: "1 1 180px" }}>
            <div className="form-label">Release</div>
            <div
              className="form-input"
              style={{
                background: "#f9fafb",
                cursor: "default",
                color: "#111827",
                fontWeight: 500,
              }}
            >
              {release.name}
            </div>
          </div>
          <div style={{ flex: "1 1 160px" }}>
            <div className="form-label">Date</div>
            <div
              className="form-input"
              style={{ background: "#f9fafb", cursor: "default", color: "#374151" }}
            >
              {format(new Date(release.date), "MMMM d, yyyy")}
            </div>
          </div>
          <div style={{ paddingBottom: "7px" }}>
            <StatusBadge status={release.status} />
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ padding: "12px 20px", borderBottom: "1px solid #f3f4f6" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "11px",
              color: "#6b7280",
              marginBottom: "5px",
            }}
          >
            <span>Progress</span>
            <span>
              {stepsCompleted.length} / {RELEASE_STEPS.length} steps
            </span>
          </div>
          <div
            style={{
              height: "5px",
              background: "#e5e7eb",
              borderRadius: "9999px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressPercent}%`,
                background:
                  progressPercent === 100 ? "#059669" : "var(--color-indigo)",
                borderRadius: "9999px",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        {/* Steps */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {RELEASE_STEPS.map((step) => {
              const isChecked = stepsCompleted.includes(step.id);
              return (
                <li
                  key={step.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "7px 0",
                    borderBottom:
                      step.id < RELEASE_STEPS.length - 1
                        ? "1px solid #f3f4f6"
                        : "none",
                  }}
                >
                  <input
                    type="checkbox"
                    id={`step-${step.id}`}
                    className="step-checkbox"
                    checked={isChecked}
                    onChange={() => handleStepToggle(step.id)}
                  />
                  <label
                    htmlFor={`step-${step.id}`}
                    style={{
                      fontSize: "13px",
                      color: isChecked ? "#9ca3af" : "#374151",
                      textDecoration: isChecked ? "line-through" : "none",
                      cursor: "pointer",
                      lineHeight: 1.4,
                      userSelect: "none",
                    }}
                  >
                    {step.label}
                  </label>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Additional info */}
        <div style={{ padding: "16px 20px" }}>
          <label className="form-label" htmlFor="additional-info">
            Additional remarks / tasks
          </label>
          <textarea
            id="additional-info"
            className="form-input"
            placeholder="Please enter any other important notes for the release..."
            rows={4}
            value={additionalInfo}
            onChange={(e) => {
              setAdditionalInfo(e.target.value);
            }}
            style={{ resize: "vertical", marginBottom: "12px" }}
          />

          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "10px" }}>
            {saveSuccess && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "12px",
                  color: "#059669",
                }}
              >
                <Check size={13} /> Saved
              </span>
            )}
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
              style={{ padding: "6px 16px" }}
            >
              {saving ? (
                "Saving…"
              ) : (
                <>
                  <Save size={13} />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <DeleteReleaseModal
          releaseId={release.id}
          releaseName={release.name}
          onClose={() => setShowDeleteModal(false)}
          onDeleted={() => {
            setShowDeleteModal(false);
            onBack();
          }}
        />
      )}
    </div>
  );
}
