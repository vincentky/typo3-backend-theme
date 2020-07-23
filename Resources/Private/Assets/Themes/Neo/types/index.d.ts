/* tslint:disable:max-classes-per-file */

/**
 * Currently a mixture between namespace and global object
 * Add types as you use them
 */
declare namespace Starfishprime {
  export let IconsManager: any;

}

interface Doktype {
  nodeType: number;
  icon: string;
  title: string;
  tooltip: string;
}

interface TreeNode {
  hasChildren: boolean;
  nameSourceField: string;
  prefix: string;
  suffix: string;
  locked: boolean;
  overlayIcon: string;
  selectable: boolean;
  expanded: boolean;
  checked: boolean;
  backgroundColor: string;
  stopPageTree: boolean;
  class: string;
  readableRootline: string;
  isMountPoint: boolean;
  stateIdentifier: string;
  identifier: number;
  depth: number;
  tip: string;
  icon: string;
  name: string;
  mountPoint: number;
  workspaceId: number;
  siblingsCount: number;
  siblingsPosition: number;

  append(text: string): TreeNode;

  attr(attr: string, callback: (node: TreeNode) => number | string | number): TreeNode;
}
