import { Node } from '@/types';

export function flattenNodeTree(rootNode: Node): Node[] {
  const result: Node[] = [];

  function traverse(node: Node) {
    result.push(node);
    if (node.children && node.children.length > 0) {
      node.children.forEach(traverse);
    }
  }

  traverse(rootNode);
  return result;
}

export function findNodeInTree(rootNode: Node, targetId: string): Node | null {
  if (rootNode.id === targetId) return rootNode;
  if (!rootNode.children) return null;

  for (const child of rootNode.children) {
    const found = findNodeInTree(child, targetId);
    if (found) return found;
  }

  return null;
}

export function calculateTreeDepth(node: Node): number {
  if (!node.children || node.children.length === 0) return 1;
  return 1 + Math.max(...node.children.map(calculateTreeDepth));
}
