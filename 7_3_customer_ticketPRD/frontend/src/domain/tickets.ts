const STATUSES = [
  "open",
  "assigned",
  "in_progress",
  "waiting",
  "resolved",
  "closed",
  "reopened",
] as const;

const PRIOS = ["low", "medium", "high", "urgent"] as const;

export const STATUS_OPTS = [...STATUSES];
export const PRIORITY_OPTS = [...PRIOS];

export function statusTone(status: string) {
  switch (status) {
    case "open":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
    case "assigned":
    case "in_progress":
      return "bg-sky-500/15 text-sky-700 dark:text-sky-300";
    case "waiting":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
    case "resolved":
    case "closed":
      return "bg-slate-500/15 text-slate-700 dark:text-slate-300";
    case "reopened":
      return "bg-purple-500/15 text-purple-700 dark:text-purple-300";
    default:
      return "bg-borderline text-ink-muted";
  }
}

export function priorityTone(prio: string) {
  switch (prio) {
    case "urgent":
      return "bg-red-500/15 text-red-700 dark:text-red-400";
    case "high":
      return "bg-orange-500/15 text-orange-700 dark:text-orange-300";
    case "medium":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
    case "low":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
    default:
      return "bg-borderline text-ink-muted";
  }
}

export function slaWarnings(ticket: { sla?: { first_response_approaching?: boolean; resolution_approaching?: boolean } }) {
  const msgs: string[] = [];
  if (ticket.sla?.first_response_approaching) msgs.push("First-response SLA narrowing");
  if (ticket.sla?.resolution_approaching) msgs.push("Resolution SLA narrowing");
  return msgs;
}
