const statusConfig = {
  success: { bg: 'bg-success-light', text: 'text-green-700', dot: 'bg-success' },
  warning: { bg: 'bg-warning-light', text: 'text-amber-700', dot: 'bg-warning' },
  danger: { bg: 'bg-danger-light', text: 'text-red-700', dot: 'bg-danger' },
  info: { bg: 'bg-primary-light', text: 'text-blue-700', dot: 'bg-primary' },
};

const labelMap = {
  paid: { variant: 'success', label: 'Paid' },
  active: { variant: 'success', label: 'Active' },
  pending: { variant: 'warning', label: 'Pending' },
  paused: { variant: 'warning', label: 'Paused' },
  overdue: { variant: 'danger', label: 'Overdue' },
  cancelled: { variant: 'danger', label: 'Cancelled' },
};

export default function StatusBadge({ status, label }) {
  const mapped = labelMap[status] || { variant: 'info', label: label || status };
  const config = statusConfig[mapped.variant];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {mapped.label}
    </span>
  );
}
