import type { EventNode } from '@/types';

/** Depth-first list of a subtree, parents before children. */
export function flattenNodeTree(root?: EventNode | null): EventNode[] {
  if (!root) return [];
  const out: EventNode[] = [];
  const walk = (node: EventNode) => {
    out.push(node);
    node.children?.forEach(walk);
  };
  walk(root);
  return out;
}

export function flattenForest(forest?: EventNode[] | null): EventNode[] {
  return (forest ?? []).flatMap((node) => flattenNodeTree(node));
}

export function findNodeInTree(root: EventNode | null, targetId: string): EventNode | null {
  if (!root) return null;
  if (root.id === targetId) return root;
  for (const child of root.children ?? []) {
    const found = findNodeInTree(child, targetId);
    if (found) return found;
  }
  return null;
}

export function findNodeInForest(forest: EventNode[], targetId: string): EventNode | null {
  for (const root of forest) {
    const found = findNodeInTree(root, targetId);
    if (found) return found;
  }
  return null;
}

export function calculateTreeDepth(node?: EventNode | null): number {
  if (!node) return 0;
  if (!node.children?.length) return 1;
  return 1 + Math.max(...node.children.map(calculateTreeDepth));
}

/** Ids on the path from a root down to `targetId`, inclusive. */
export function pathToNode(forest: EventNode[], targetId: string): string[] {
  const walk = (node: EventNode, trail: string[]): string[] | null => {
    const next = [...trail, node.id];
    if (node.id === targetId) return next;
    for (const child of node.children ?? []) {
      const found = walk(child, next);
      if (found) return found;
    }
    return null;
  };
  for (const root of forest) {
    const found = walk(root, []);
    if (found) return found;
  }
  return [];
}

/**
 * True when `candidateParentId` sits inside `nodeId`'s own subtree.
 * Re-parenting there would detach the branch from the tree, so the drag layer
 * refuses the drop before the request is ever sent.
 */
export function isDescendant(
  forest: EventNode[],
  nodeId: string,
  candidateParentId: string,
): boolean {
  const node = findNodeInForest(forest, nodeId);
  if (!node) return false;
  return flattenNodeTree(node).some((n) => n.id === candidateParentId && n.id !== nodeId);
}

/** Rebuilds a nested forest from a flat node list, sorted by `sortOrder`. */
export function buildForest(nodes: EventNode[]): EventNode[] {
  const byId = new Map<string, EventNode>();
  nodes.forEach((node) => byId.set(node.id, { ...node, children: [] }));

  const roots: EventNode[] = [];
  byId.forEach((node) => {
    const parent = node.parentId ? byId.get(node.parentId) : null;
    if (parent) parent.children!.push(node);
    else roots.push(node);
  });

  const sortRecursive = (list: EventNode[]) => {
    list.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    list.forEach((node) => node.children && sortRecursive(node.children));
  };
  sortRecursive(roots);
  return roots;
}

/** Immutably replaces one node everywhere it appears in a forest. */
export function replaceNodeInForest(forest: EventNode[], updated: EventNode): EventNode[] {
  return forest.map((node) => {
    if (node.id === updated.id) {
      // Keep the children we already have — PATCH responses omit them.
      return { ...node, ...updated, children: updated.children ?? node.children };
    }
    if (!node.children?.length) return node;
    return { ...node, children: replaceNodeInForest(node.children, updated) };
  });
}

export function removeNodeFromForest(forest: EventNode[], nodeId: string): EventNode[] {
  return forest
    .filter((node) => node.id !== nodeId)
    .map((node) =>
      node.children?.length
        ? { ...node, children: removeNodeFromForest(node.children, nodeId) }
        : node,
    );
}
