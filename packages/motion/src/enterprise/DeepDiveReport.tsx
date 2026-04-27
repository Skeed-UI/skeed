/**
 * DeepDiveReport - Recursive drill-down report with breadcrumb navigation
 * Designed for hierarchical data exploration with smooth transitions
 */

import * as React from 'react';
import { useMotion } from '../react/useMotion.js';
import { useMotionContext } from '../react/MotionProvider.js';

export interface ReportNode {
  id: string;
  title: string;
  summary: React.ReactNode;
  detail?: React.ReactNode;
  children?: ReportNode[];
  metrics?: Array<{
    label: string;
    value: number | string;
    trend?: 'up' | 'down' | 'neutral';
    format?: 'number' | 'percent' | 'currency';
  }>;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}

export type ReportMetric = NonNullable<ReportNode['metrics']>[number];

interface DeepDiveReportProps {
  root: ReportNode;
  maxDepth?: number;
  className?: string;
  motion?: {
    drill?: string;
    expand?: string;
    breadcrumb?: string;
  };
  onNavigate?: (path: ReportNode[]) => void;
  renderMetric?: (metric: ReportMetric) => React.ReactNode;
  renderSummary?: (node: ReportNode) => React.ReactNode;
  renderDetail?: (node: ReportNode) => React.ReactNode;
}

interface BreadcrumbItem {
  node: ReportNode;
  depth: number;
}

export function DeepDiveReport({
  root,
  maxDepth = 5,
  className,
  motion = {
    drill: '[material:glass] [drill:push-fold]',
    expand: '[material:glass] [expand:origami-unfold]',
    breadcrumb: '[navigate:slide-stack]',
  },
  onNavigate,
  renderMetric,
  renderSummary,
  renderDetail,
}: DeepDiveReportProps): React.ReactElement {
  const context = useMotionContext();
  const disabled = context.reducedMotion;

  const [breadcrumb, setBreadcrumb] = React.useState<BreadcrumbItem[]>([
    { node: root, depth: 0 },
  ]);
  const [expandingNode, setExpandingNode] = React.useState<string | null>(null);

  const current = breadcrumb[breadcrumb.length - 1];
  if (!current) {
    return <div style={{ padding: '24px' }}>No data</div>;
  }
  const currentDepth = current.depth;

  const navigateTo = React.useCallback(
    (node: ReportNode, depth: number) => {
      setExpandingNode(node.id);
      const newPath = breadcrumb.slice(0, depth);
      newPath.push({ node, depth });
      setBreadcrumb(newPath);
      onNavigate?.(newPath.map((b) => b.node));
      setTimeout(() => setExpandingNode(null), 400);
    },
    [breadcrumb, onNavigate]
  );

  const navigateBack = React.useCallback(
    (targetDepth: number) => {
      if (targetDepth >= breadcrumb.length - 1) return;
      const newPath = breadcrumb.slice(0, targetDepth + 1);
      setBreadcrumb(newPath);
      onNavigate?.(newPath.map((b) => b.node));
    },
    [breadcrumb, onNavigate]
  );

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '12px',
        background: 'var(--skeed-color-neutral-50)',
      }}
    >
      {/* Breadcrumb Navigation */}
      {breadcrumb.length > 1 && (
        <BreadcrumbNav
          items={breadcrumb}
          onNavigate={navigateBack}
          motion={motion.breadcrumb}
          disabled={disabled}
        />
      )}

      {/* Current Level Content */}
      <div
        style={{
          padding: '24px',
          animation: disabled
            ? undefined
            : expandingNode
            ? 'pushFold 0.4s ease'
            : 'origamiUnfold 0.4s ease',
        }}
      >
        {/* Node Summary */}
        <div style={{ marginBottom: '20px' }}>
          {renderSummary ? (
            renderSummary(current.node)
          ) : (
            <DefaultSummary node={current.node} />
          )}
        </div>

        {/* Metrics Grid */}
        {current.node.metrics && current.node.metrics.length > 0 && (
          <MetricsGrid
            metrics={current.node.metrics}
            renderMetric={renderMetric}
            disabled={disabled}
          />
        )}

        {/* Detail Section */}
        {current.node.detail && (
          <div style={{ marginTop: '20px', padding: '16px', background: 'white', borderRadius: '8px' }}>
            {renderDetail ? renderDetail(current.node) : current.node.detail}
          </div>
        )}

        {/* Children Grid */}
        {current.node.children && currentDepth < maxDepth && (
          <ChildrenGrid
            children={current.node.children}
            onNavigate={(node) => navigateTo(node, currentDepth + 1)}
            disabled={disabled}
            motion={motion.drill}
          />
        )}
      </div>

      <style>{`
        @keyframes pushFold {
          0% { transform: translateX(0) scale(1); opacity: 1; }
          50% { transform: translateX(-20%) scale(0.95); opacity: 0.7; }
          100% { transform: translateX(-100%) scale(0.9); opacity: 0; }
        }
        @keyframes origamiUnfold {
          0% { transform: translateX(100%) scale(0.9); opacity: 0; }
          50% { transform: translateX(10%) scale(0.98); opacity: 0.8; }
          100% { transform: translateX(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function BreadcrumbNav({
  items,
  onNavigate,
  motion,
  disabled,
}: {
  items: BreadcrumbItem[];
  onNavigate: (depth: number) => void;
  motion?: string | undefined;
  disabled: boolean;
}): React.ReactElement {
  const motionResult = useMotion({
    config: disabled ? '' : motion || '[material:glass]',
    disabled,
  });

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 24px',
        borderBottom: '1px solid var(--skeed-color-neutral-200)',
        background: 'white',
        ...motionResult.style,
      }}
      {...motionResult.handlers}
    >
      {items.map((item, index) => (
        <React.Fragment key={item.node.id}>
          <button
            onClick={() => onNavigate(index)}
            style={{
              padding: '4px 8px',
              border: 'none',
              background: index === items.length - 1 ? 'var(--skeed-color-brand-50)' : 'transparent',
              color: index === items.length - 1
                ? 'var(--skeed-color-brand-700)'
                : 'var(--skeed-color-neutral-600)',
              borderRadius: '4px',
              cursor: index === items.length - 1 ? 'default' : 'pointer',
              fontSize: '14px',
              fontWeight: index === items.length - 1 ? '600' : '400',
              animation: disabled ? undefined : `slideStack 0.3s ease ${index * 50}ms both`,
            }}
          >
            {item.node.title}
          </button>
          {index < items.length - 1 && (
            <span style={{ color: 'var(--skeed-color-neutral-400)' }}>/</span>
          )}
        </React.Fragment>
      ))}

      <style>{`
        @keyframes slideStack {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </nav>
  );
}

function DefaultSummary({ node }: { node: ReportNode }): React.ReactElement {
  const statusColors = {
    success: { bg: 'var(--skeed-color-success-50)', text: 'var(--skeed-color-success-700)' },
    warning: { bg: 'var(--skeed-color-warning-50)', text: 'var(--skeed-color-warning-700)' },
    error: { bg: 'var(--skeed-color-danger-50)', text: 'var(--skeed-color-danger-700)' },
    info: { bg: 'var(--skeed-color-info-50)', text: 'var(--skeed-color-info-700)' },
    neutral: { bg: 'var(--skeed-color-neutral-100)', text: 'var(--skeed-color-neutral-700)' },
  };

  const status = node.status || 'neutral';
  const colors = statusColors[status];

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
      {node.priority && (
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background:
              node.priority === 'critical'
                ? 'var(--skeed-color-danger-500)'
                : node.priority === 'high'
                ? 'var(--skeed-color-warning-500)'
                : node.priority === 'medium'
                ? 'var(--skeed-color-info-500)'
                : 'var(--skeed-color-neutral-400)',
            marginTop: '6px',
            flexShrink: 0,
          }}
        />
      )}
      <div style={{ flex: 1 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '600' }}>{node.title}</h3>
        <div style={{ color: 'var(--skeed-color-neutral-600)', fontSize: '14px' }}>
          {node.summary}
        </div>
      </div>
      {node.status && (
        <span
          style={{
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '500',
            background: colors.bg,
            color: colors.text,
          }}
        >
          {status}
        </span>
      )}
    </div>
  );
}

function MetricsGrid({
  metrics,
  renderMetric,
  disabled,
}: {
  metrics: ReportMetric[];
  renderMetric?: ((metric: ReportMetric) => React.ReactNode) | undefined;
  disabled: boolean;
}): React.ReactElement {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '12px',
        marginTop: '20px',
      }}
    >
      {metrics.map((metric, index) => (
        <div
          key={metric.label}
          style={{
            padding: '16px',
            background: 'white',
            borderRadius: '8px',
            border: '1px solid var(--skeed-color-neutral-200)',
            animation: disabled ? undefined : `dominoReveal 0.3s ease ${index * 80}ms both`,
          }}
        >
          {renderMetric ? renderMetric(metric) : <DefaultMetric metric={metric} />}
        </div>
      ))}

      <style>{`
        @keyframes dominoReveal {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function DefaultMetric({ metric }: { metric: ReportMetric }): React.ReactElement {
  const trendColors: Record<'up' | 'down' | 'neutral', string> = {
    up: 'var(--skeed-color-success-500)',
    down: 'var(--skeed-color-danger-500)',
    neutral: 'var(--skeed-color-neutral-500)',
  };

  const formatValue = (value: number | string, format?: string): string => {
    if (typeof value === 'string') return value;
    switch (format) {
      case 'percent':
        return `${value}%`;
      case 'currency':
        return `$${value.toLocaleString()}`;
      default:
        return value.toLocaleString();
    }
  };

  return (
    <div>
      <div style={{ fontSize: '12px', color: 'var(--skeed-color-neutral-500)', marginBottom: '4px' }}>
        {metric.label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '24px', fontWeight: '700', color: 'var(--skeed-color-neutral-900)' }}>
          {formatValue(metric.value, metric.format)}
        </span>
        {metric.trend && (
          <span style={{ color: trendColors[metric.trend as 'up' | 'down' | 'neutral'], fontSize: '16px' }}>
            {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
          </span>
        )}
      </div>
    </div>
  );
}

function ChildrenGrid({
  children,
  onNavigate,
  disabled,
  motion,
}: {
  children: ReportNode[];
  onNavigate: (node: ReportNode) => void;
  disabled: boolean;
  motion?: string | undefined;
}): React.ReactElement {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        marginTop: '24px',
      }}
    >
      {children.map((child, index) => (
        <DrillDownCard
          key={child.id}
          node={child}
          onClick={() => onNavigate(child)}
          delay={index * 100}
          disabled={disabled}
          motion={motion}
        />
      ))}
    </div>
  );
}

function DrillDownCard({
  node,
  onClick,
  delay,
  disabled,
  motion,
}: {
  node: ReportNode;
  onClick: () => void;
  delay: number;
  disabled: boolean;
  motion?: string | undefined;
}): React.ReactElement {
  const motionConfig = disabled
    ? ''
    : motion || '[material:glass] [onHover:lift] [onClick:elastic]';

  const motionResult = useMotion({
    config: motionConfig,
    disabled,
  });

  return (
    <button
      onClick={onClick}
      style={{
        padding: '16px',
        background: 'white',
        border: '1px solid var(--skeed-color-neutral-200)',
        borderRadius: '8px',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        animation: disabled ? undefined : `peekWipe 0.4s ease ${delay}ms both`,
        ...motionResult.style,
      }}
      {...motionResult.handlers}
    >
      <div style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--skeed-color-neutral-900)' }}>
        {node.title}
      </div>
      {node.summary && (
        <div style={{ fontSize: '14px', color: 'var(--skeed-color-neutral-600)' }}>
          {typeof node.summary === 'string' && node.summary.length > 60
            ? `${node.summary.slice(0, 60)}...`
            : node.summary}
        </div>
      )}
      {node.metrics && node.metrics.length > 0 && (
        <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--skeed-color-neutral-500)' }}>
          {node.metrics.length} metric{node.metrics.length > 1 ? 's' : ''}
        </div>
      )}
      {node.children && node.children.length > 0 && (
        <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--skeed-color-brand-500)' }}>
          Explore →
        </div>
      )}

      <style>{`
        @keyframes peekWipe {
          from { transform: translateX(-10px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </button>
  );
}
