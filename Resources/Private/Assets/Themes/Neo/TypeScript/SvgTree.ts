import SvgTree from 'TYPO3/CMS/Backend/SvgTree';

SvgTree.prototype.appendTextElement = function(node: TreeNode) {
    this.textPosition = 37;
  // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;
    return node
        .append('text')
        .attr('dx', (node: TreeNode) => {
            return this.textPosition + (node.locked ? 15 : 0);
        })
        .attr('dy', 8)
        .attr('class', 'node-name')
        .on('click', function(node: TreeNode) {
          that.clickOnLabel(node, this);
        });
};

SvgTree.prototype.getChevronColor = (node: TreeNode): string => (node.expanded ? '#fff' : '#8a8a8a');

SvgTree.prototype.setWrapperHeight = () => null;
