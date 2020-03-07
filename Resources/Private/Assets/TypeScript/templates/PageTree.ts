import TreeToolbar from 'TYPO3/CMS/Backend/PageTree/PageTreeToolbar';

import SvgTree from 'TYPO3/CMS/Backend/SvgTree';

SvgTree.prototype.appendTextElement = function (node) {
  var _this = this;
  _this.textPosition = 37;
  return node
    .append('text')
    .attr('dx', function (node) {
      return _this.textPosition + (node.locked ? 15 : 0);
    })
    .attr('dy', 8)
    .attr('class', 'node-name')
    .on('click', function (node) {
      _this.clickOnLabel(node, this);
    });
};

SvgTree.prototype.getChevronColor = function (node) {
  return node.expanded ? '#fff' : '#8a8a8a';
};
TreeToolbar.prototype.createTemplate = function () {

  var _this = this;

  var $template = $(
    '<div class="' + _this.settings.toolbarSelector + '">' +
    '<div class="svg-toolbar__menu">' +

    '<button class="svg-toolbar__btn" data-tree-icon="actions-refresh" title="' + TYPO3.lang['labels.refresh'] + '"></button>' +

    '</div>' +
    '</div>' +
    '<div class="svg-toolbar__submenu">' +
    '<div class="svg-toolbar__submenu-item" data-tree-submenu="filter">' +
    '<button class="svg-toolbar__btn" data-tree-icon="actions-search" data-tree-show-submenu="filter" title="' + TYPO3.lang['tree.buttonFilter'] + '"></button>' +
    '<input type="text" class="form-control search-input" placeholder="' + TYPO3.lang['tree.searchTermInfo'] + '">' +
    '</div>' +
    '<div class="svg-toolbar__submenu-item" data-tree-submenu="page-new">' +
    '</div>' +
    '</div>'
  );

  if (this.tree.settings.doktypes && this.tree.settings.doktypes.length) {
    var $buttons = $template.find('[data-tree-submenu=page-new]');
    $template.find('.svg-toolbar__menu').prepend(
      '<button class="svg-toolbar__btn"  data-tree-show-submenu="page-new" data-tree-icon="actions-page-new" title="' + TYPO3.lang['tree.buttonNewNode'] + '"></button>');

    $.each(this.tree.settings.doktypes, function (id, e) {
      _this.tree.fetchIcon(e.icon, false);
      $buttons.append('<div class="svg-toolbar__drag-node" data-tree-icon="' + e.icon + '" data-node-type="' + e.nodeType + '" title="' + e.title + '" tooltip="' + e.tooltip + '">' + e.tooltip + '</div>');
    });
  }

  _this.template = $template;
}
