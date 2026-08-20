import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

export const RiskBadge = ({ level = 'routine', showIcon = true, size = 'md', className = '' }) => {
  const getBadgeConfig = () => {
    switch (level?.toLowerCase()) {
      case 'urgent':
        return {
          bg: 'bg-red-100 text-red-800 border-red-300',
          dot: 'bg-red-500',
          label: 'Urgent Medical Attention Recommended',
          shortLabel: 'Urgent 🔴',
          icon: ShieldAlert,
          iconColor: 'text-red-600'
        };
      case 'prompt_eval':
        return {
          bg: 'bg-amber-100 text-amber-900 border-amber-300',
          dot: 'bg-amber-500',
          label: 'Prompt Medical Evaluation Recommended',
          shortLabel: 'Prompt Eval 🟠',
          icon: AlertCircle,
          iconColor: 'text-amber-600'
        };
      case 'follow_up':
        return {
          bg: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          dot: 'bg-yellow-500',
          label: 'Healthcare Professional Follow-up Recommended',
          shortLabel: 'Follow-up 🟡',
          icon: AlertTriangle,
          iconColor: 'text-yellow-600'
        };
      case 'routine':
      default:
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-500',
          label: 'Routine Monitoring',
          shortLabel: 'Routine 🟢',
          icon: CheckCircle,
          iconColor: 'text-emerald-600'
        };
    }
  };

  const config = getBadgeConfig();
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-medium',
    md: 'px-3 py-1 text-xs sm:text-sm font-semibold',
    lg: 'px-4 py-2 text-sm font-bold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-sm transition-all ${config.bg} ${sizeClasses[size] || sizeClasses.md} ${className}`}
      title={config.label}
    >
      <span className={`h-2 w-2 rounded-full ${config.dot} animate-pulse`} />
      {showIcon && <IconComponent className={`h-3.5 w-3.5 ${config.iconColor}`} />}
      <span>{config.label}</span>
    </span>
  );
};

export default RiskBadge;
