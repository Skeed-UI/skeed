/**
 * VisualSummary - Expandable data summaries with telescope-expand effect
 * Designed for progressive disclosure of information
 */

import * as React from 'react';
import { useMotion } from '../react/useMotion.js';
import { useMotionContext } from '../react/MotionProvider.js';
import { ChevronDown, ArrowUp, ArrowDown, ArrowRight } from '@skeed/asset-icon';

export interface SummaryData {
  id: string;
  label: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  format?: 'number' | 'percent' | 'currency' | 'compact';
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  color?: string;
}

interface VisualSummaryProps {
  title: string;
  subtitle?: string;
  data: SummaryData[];
  detailView?: React.ReactNode;
  className?: string;
  layout?: 'grid' | 'row' | 'featured';
  expandable?: boolean;
  motion?: {
    enter?: string;
    hover?: string;
    expand?: string;
  };
  onExpand?: (expanded: boolean) => void;
  renderItem?: ((item: SummaryData, index: number) => React.ReactNode) | undefined;
}

export function VisualSummary({
  title,
  subtitle,
  data,
  detailView,
  className,
  layout = 'grid',
  expandable = false,
  motion = {
    enter: '[enter:domino-reveal]',
    hover: '[onHover:telescope-expand]',
    expand: '[expand:unfold-cascade]',
  },
  onExpand,
  renderItem,
}: VisualSummaryProps): React.ReactElement {
  const context = useMotionContext();
  const disabled = context.reducedMotion;
  const [expanded, setExpanded] = React.useState(false);
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  const handleExpand = React.useCallback(() => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    onExpand?.(newExpanded);
  }, [expanded, onExpand]);

  const motionConfig = disabled || !motion?.enter ? '' : motion.enter;
  const motionResult = useMotion({
    config: motionConfig,
    disabled,
  });

  const gridTemplate =
    layout === 'grid'
      ? { gridTemplateColumns: `repeat(${Math.min(data.length, 4)}, 1fr)` }
      : layout === 'featured'
      ? { gridTemplateColumns: '2fr 1fr 1fr' }
      : { gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' };

  return (
    <div
      className={className}
      style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid var(--skeed-color-neutral-200)',
        overflow: 'hidden',
        ...motionResult.style,
      }}
      {...motionResult.handlers}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px 24px',
          borderBottom: expanded ? '1px solid var(--skeed-color-neutral-200)' : 'none',
          cursor: expandable ? 'pointer' : 'default',
        }}
        onClick={expandable ? handleExpand : undefined}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '600' }}>{title}</h3>
            {subtitle && (
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--skeed-color-neutral-500)' }}>
                {subtitle}
              </p>
            )}
          </div>
          {expandable && (
            <div
              style={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease',
              }}
            >
              <ChevronDown size={20} />
            </div>
          )}
        </div>
      </div>

      {/* Data Grid */}
      <div
        style={{
          display: 'grid',
          gap: '1px',
          background: 'var(--skeed-color-neutral-200)',
          ...gridTemplate,
        }}
      >
        {data.map((item, index) => (
          <SummaryItem
            key={item.id}
            item={item}
            index={index}
            disabled={disabled}
            motion={motion.hover}
            isHovered={hoveredId === item.id}
            onHover={setHoveredId}
            renderItem={renderItem}
          />
        ))}
      </div>

      {/* Expanded Detail View */}
      {expandable && expanded && detailView && (
        <div
          style={{
            padding: '24px',
            background: 'var(--skeed-color-neutral-50)',
            animation: disabled ? undefined : 'unfoldCascade 0.4s ease',
          }}
        >
          {detailView}
        </div>
      )}

      <style>{`
        @keyframes unfoldCascade {
          from {
            opacity: 0;
            transform: translateY(-10px);
            max-height: 0;
          }
          to {
            opacity: 1;
            transform: translateY(0);
            max-height: 1000px;
          }
        }
      `}</style>
    </div>
  );
}

interface SummaryItemProps {
  item: SummaryData;
  index: number;
  disabled: boolean;
  motion?: string | undefined;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  renderItem?: ((item: SummaryData, index: number) => React.ReactNode) | undefined;
}

function SummaryItem({
  item,
  index,
  disabled,
  motion,
  isHovered,
  onHover,
  renderItem,
}: SummaryItemProps): React.ReactElement {
  const motionConfig = disabled ? '' : motion || '[material:glass] [onHover:lift]';
  const motionResult = useMotion({
    config: motionConfig,
    disabled,
  });

  const formatValue = (value: number | string, format?: string): string => {
    if (typeof value === 'string') return value;
    switch (format) {
      case 'percent':
        return `${value}%`;
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'compact':
        return value >= 1000000
          ? `${(value / 1000000).toFixed(1)}M`
          : value >= 1000
          ? `${(value / 1000).toFixed(1)}K`
          : value.toLocaleString();
      default:
        return value.toLocaleString();
    }
  };

  const trendColors: Record<'up' | 'down' | 'neutral', string> = {
    up: 'var(--skeed-color-success-500)',
    down: 'var(--skeed-color-danger-500)',
    neutral: 'var(--skeed-color-neutral-500)',
  };

  if (renderItem) {
    return (
      <div
        style={{
          background: 'white',
          padding: '20px',
          animation: disabled ? undefined : `dominoReveal 0.3s ease ${index * 100}ms both`,
          ...motionResult.style,
        }}
        {...motionResult.handlers}
        onMouseEnter={() => onHover(item.id)}
        onMouseLeave={() => onHover(null)}
      >
        {renderItem(item, index)}
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'white',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
        animation: disabled ? undefined : `dominoReveal 0.3s ease ${index * 100}ms both`,
        ...motionResult.style,
      }}
      {...motionResult.handlers}
      onMouseEnter={() => onHover(item.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Telescope expand effect background */}
      {isHovered && !disabled && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(135deg, ${item.color || 'var(--skeed-color-brand-50)'} 0%, transparent 60%)`,
            opacity: 0.5,
            animation: 'telescopeExpand 0.3s ease',
          }}
        />
      )}

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Icon and Label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          {item.icon && <span style={{ color: item.color || 'var(--skeed-color-neutral-500)' }}>{item.icon}</span>}
          <span style={{ fontSize: '12px', color: 'var(--skeed-color-neutral-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {item.label}
          </span>
        </div>

        {/* Value */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <span
            style={{
              fontSize: '28px',
              fontWeight: '700',
              color: item.color || 'var(--skeed-color-neutral-900)',
            }}
          >
            {formatValue(item.value, item.format)}
          </span>

          {/* Change indicator */}
          {(item.change !== undefined || item.trend) && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '14px',
                fontWeight: '500',
                color: item.trend ? trendColors[item.trend] : 'var(--skeed-color-neutral-500)',
              }}
            >
              {item.trend === 'up' ? <ArrowUp size={14} /> : item.trend === 'down' ? <ArrowDown size={14} /> : <ArrowRight size={14} />}
              {item.change !== undefined && Math.abs(item.change).toFixed(1)}
              {item.changeLabel && (
                <span style={{ fontSize: '12px', color: 'var(--skeed-color-neutral-400)' }}>
                  {item.changeLabel}
                </span>
              )}
            </span>
          )}
        </div>
      </div>

      <style>{`
        @keyframes dominoReveal {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes telescopeExpand {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

// KPIGrid component for multiple related summaries
interface KPIGridProps {
  metrics: SummaryData[];
  title?: string;
  className?: string;
  columns?: number;
}

export function KPIGrid({ metrics, title, className, columns = 4 }: KPIGridProps): React.ReactElement {
  const context = useMotionContext();
  const disabled = context.reducedMotion;

  return (
    <div className={className}>
      {title && (
        <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '600', color: 'var(--skeed-color-neutral-600)' }}>
          {title}
        </h4>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: '16px',
        }}
      >
        {metrics.map((metric, index) => (
          <KPICard key={metric.id} metric={metric} index={index} disabled={disabled} />
        ))}
      </div>
    </div>
  );
}

function KPICard({
  metric,
  index,
  disabled,
}: {
  metric: SummaryData;
  index: number;
  disabled: boolean;
}): React.ReactElement {
  const motionConfig = disabled ? '' : '[material:metal] [onHover:magnetic:strength=0.3]';
  const motionResult = useMotion({
    config: motionConfig,
    disabled,
  });

  const trendColors: Record<'up' | 'down' | 'neutral', string> = {
    up: 'var(--skeed-color-success-500)',
    down: 'var(--skeed-color-danger-500)',
    neutral: 'var(--skeed-color-neutral-500)',
  };

  return (
    <div
      style={{
        padding: '16px',
        background: 'white',
        borderRadius: '8px',
        border: '1px solid var(--skeed-color-neutral-200)',
        animation: disabled ? undefined : `rippleRefresh 0.5s ease ${index * 80}ms both`,
        ...motionResult.style,
      }}
      {...motionResult.handlers}
    >
      <div style={{ fontSize: '12px', color: 'var(--skeed-color-neutral-500)', marginBottom: '8px' }}>
        {metric.label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '20px', fontWeight: '700', color: 'var(--skeed-color-neutral-900)' }}>
          {metric.value}
        </span>
        {metric.trend && (
          <span style={{ color: trendColors[metric.trend], fontSize: '14px' }}>
            {metric.trend === 'up' ? <ArrowUp size={14} /> : metric.trend === 'down' ? <ArrowDown size={14} /> : <ArrowRight size={14} />}
          </span>
        )}
      </div>

      <style>{`
        @keyframes rippleRefresh {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
