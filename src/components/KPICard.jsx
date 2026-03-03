import { TrendingUp, TrendingDown } from 'lucide-react';

export default function KPICard({ icon: Icon, label, value, trend, trendValue, color = 'primary' }) {
  const colorMap = {
    primary: 'bg-primary-light text-primary',
    success: 'bg-success-light text-green-600',
    warning: 'bg-warning-light text-amber-600',
    danger: 'bg-danger-light text-red-600',
  };

  return (
    <div className="bg-white rounded-lg border border-border p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          {Icon && <Icon size={20} />}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {trendValue}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-sm text-text-secondary mt-1">{label}</p>
    </div>
  );
}
