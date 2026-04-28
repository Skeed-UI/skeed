import { ChevronRight } from '@skeed/asset-icon';
import { cn } from '@skeed/core/cn';
import {
  type HTMLAttributes,
  type KeyboardEvent,
  forwardRef,
  useCallback,
  useRef,
  useState,
} from 'react';

export interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
  disabled?: boolean;
}

export interface TreeProps extends HTMLAttributes<HTMLDivElement> {
  nodes: TreeNode[];
  defaultExpanded?: string[];
  onNodeSelect?: (node: TreeNode) => void;
}

export const Tree = forwardRef<HTMLDivElement, TreeProps>(function Tree(
  { className, nodes, defaultExpanded = [], onNodeSelect, ...rest },
  ref,
) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(defaultExpanded));
  const [focusedNode, setFocusedNode] = useState<string | null>(null);
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const isExpanded = (nodeId: string) => expandedNodes.has(nodeId);

  const getAllNodeIds = useCallback((nodes: TreeNode[]): string[] => {
    return nodes.flatMap((node) => [
      node.id,
      ...(node.children ? getAllNodeIds(node.children) : []),
    ]);
  }, []);

  const getVisibleNodes = useCallback(
    (nodes: TreeNode[]): TreeNode[] => {
      return nodes.flatMap((node) => {
        if (!isExpanded(node.id) && node.children) {
          return [node];
        }
        return [node, ...(node.children ? getVisibleNodes(node.children) : [])];
      });
    },
    [expandedNodes],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent, node: TreeNode) => {
      const allVisibleIds = getVisibleNodes(nodes).map((n) => n.id);
      const currentIndex = allVisibleIds.indexOf(node.id);

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          if (currentIndex < allVisibleIds.length - 1) {
            const nextId = allVisibleIds[currentIndex + 1];
            itemRefs.current.get(nextId)?.focus();
            setFocusedNode(nextId);
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (currentIndex > 0) {
            const prevId = allVisibleIds[currentIndex - 1];
            itemRefs.current.get(prevId)?.focus();
            setFocusedNode(prevId);
          }
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (node.children && node.children.length > 0) {
            if (!isExpanded(node.id)) {
              toggleNode(node.id);
            } else {
              // Focus first child
              const firstChild = node.children[0];
              itemRefs.current.get(firstChild.id)?.focus();
              setFocusedNode(firstChild.id);
            }
          }
          break;
        case 'ArrowLeft':
          event.preventDefault();
          if (node.children && isExpanded(node.id)) {
            toggleNode(node.id);
          }
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (node.children && node.children.length > 0) {
            toggleNode(node.id);
          } else {
            onNodeSelect?.(node);
          }
          break;
        case 'Home':
          event.preventDefault();
          if (allVisibleIds.length > 0) {
            const firstId = allVisibleIds[0];
            itemRefs.current.get(firstId)?.focus();
            setFocusedNode(firstId);
          }
          break;
        case 'End':
          event.preventDefault();
          if (allVisibleIds.length > 0) {
            const lastId = allVisibleIds[allVisibleIds.length - 1];
            itemRefs.current.get(lastId)?.focus();
            setFocusedNode(lastId);
          }
          break;
      }
    },
    [nodes, expandedNodes, toggleNode, onNodeSelect, getVisibleNodes],
  );

  return (
    <div
      ref={ref}
      role="tree"
      className={cn('flex flex-col gap-skeed-spacing-0', className)}
      {...rest}
    >
      {nodes.map((node) => (
        <TreeItem
          key={node.id}
          node={node}
          level={0}
          expandedNodes={expandedNodes}
          onToggle={toggleNode}
          onKeyDown={handleKeyDown}
          onFocus={setFocusedNode}
          itemRefs={itemRefs}
          onSelect={onNodeSelect}
        />
      ))}
    </div>
  );
});

interface TreeItemProps {
  node: TreeNode;
  level: number;
  expandedNodes: Set<string>;
  onToggle: (nodeId: string) => void;
  onKeyDown: (event: KeyboardEvent, node: TreeNode) => void;
  onFocus: (nodeId: string) => void;
  itemRefs: React.MutableRefObject<Map<string, HTMLButtonElement>>;
  onSelect?: (node: TreeNode) => void;
}

function TreeItem({
  node,
  level,
  expandedNodes,
  onToggle,
  onKeyDown,
  onFocus,
  itemRefs,
  onSelect,
}: TreeItemProps) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);

  return (
    <div
      role="treeitem"
      aria-expanded={hasChildren ? isExpanded : undefined}
      className="flex flex-col"
    >
      <button
        ref={(el) => {
          if (el) itemRefs.current.set(node.id, el);
        }}
        type="button"
        disabled={node.disabled}
        aria-disabled={node.disabled}
        className={cn(
          'flex items-center gap-skeed-spacing-2',
          'px-skeed-spacing-3 py-skeed-spacing-2',
          'text-sm font-skeed-body text-skeed-color-neutral-700',
          'hover:bg-skeed-color-neutral-100',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500',
          'rounded-skeed-radius-1',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )}
        style={{ paddingLeft: `calc(${level} * var(--skeed-spacing-4))` }}
        onClick={() => {
          if (hasChildren) {
            onToggle(node.id);
          } else {
            onSelect?.(node);
          }
        }}
        onKeyDown={(e) => onKeyDown(e, node)}
        onFocus={() => onFocus(node.id)}
      >
        {hasChildren && (
          <ChevronRight
            size={16}
            className={cn(
              'transition-transform duration-skeed-motion-duration-fast',
              isExpanded && 'rotate-90',
            )}
          />
        )}
        <span>{node.label}</span>
      </button>
      {hasChildren && isExpanded && (
        <div className="flex flex-col" role="group">
          {node.children!.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              level={level + 1}
              expandedNodes={expandedNodes}
              onToggle={onToggle}
              onKeyDown={onKeyDown}
              onFocus={onFocus}
              itemRefs={itemRefs}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
