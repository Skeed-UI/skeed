import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@skeed/core/cn';

export interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
}

export interface TreeProps extends HTMLAttributes<HTMLDivElement> {
  nodes: TreeNode[];
}

export const Tree = forwardRef<HTMLDivElement, TreeProps>(function Tree(
  { className, nodes, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      role="tree"
      className={cn('flex flex-col gap-skeed-spacing-0', className)}
      {...rest}
    >
      {nodes.map((node) => (
        <TreeItem key={node.id} node={node} level={0} />
      ))}
    </div>
  );
});

interface TreeItemProps {
  node: TreeNode;
  level: number;
}

function TreeItem({ node, level }: TreeItemProps) {
  return (
    <div role="treeitem" className="flex flex-col">
      <button
        type="button"
        className={cn(
          'flex items-center gap-skeed-spacing-2',
          'px-skeed-spacing-3 py-skeed-spacing-2',
          'text-sm font-skeed-body text-skeed-color-neutral-700',
          'hover:bg-skeed-color-neutral-100',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500',
          'rounded-skeed-radius-1',
        )}
        style={{ paddingLeft: `calc(${level} * var(--skeed-spacing-4))` }}
      >
        {node.children && node.children.length > 0 && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        )}
        <span>{node.label}</span>
      </button>
      {node.children && (
        <div className="flex flex-col">
          {node.children.map((child) => (
            <TreeItem key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
