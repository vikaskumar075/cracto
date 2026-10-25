import { ReleaseStatus } from "@/types";

interface StatusBadgeProps {
  status: ReleaseStatus;
}

const labels: Record<ReleaseStatus, string> = {
  planned: "Planned",
  ongoing: "Ongoing",
  done: "Done",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`badge badge-${status}`}>{labels[status]}</span>
  );
}
