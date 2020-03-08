import TreeToolbar from 'TYPO3/CMS/Backend/PageTree/PageTreeToolbar';
import PageTreeElement from 'TYPO3/CMS/Backend/PageTree/PageTreeElement';
import Icons from 'TYPO3/CMS/Backend/Icons';
import SvgTree from 'TYPO3/CMS/Backend/SvgTree';
import PageTreeDragDrop from 'TYPO3/CMS/Backend/PageTree/PageTreeDragDrop';
import d3 = require('d3');

SvgTree.prototype.appendTextElement = function (node: TreeNode) {
  this.textPosition = 37;
  const _this = this;
  return node
    .append('text')
    .attr('dx', (node: TreeNode) => {
      return this.textPosition + (node.locked ? 15 : 0);
    })
    .attr('dy', 8)
    .attr('class', 'node-name')
    .on('click', function (node: TreeNode) {
      _this.clickOnLabel(node, this);
    });
};

SvgTree.prototype.getChevronColor = (node: TreeNode): string => (node.expanded ? '#fff' : '#8a8a8a');

TreeToolbar.prototype.render = function () {
  this.tree = this.$treeWrapper.data('svgtree');

  this.dragDrop = PageTreeDragDrop;
  this.dragDrop.init(this);
  if (!this.$treeWrapper.data('svgtree-initialized') || typeof this.$treeWrapper.data('svgtree') !== 'object') {
    //both toolbar and tree are loaded independently through require js,
    //so we don't know which is loaded first
    //in case of toolbar being loaded first, we wait for an event from svgTree
    this.$treeWrapper.on('svgTree.initialized', this.render.bind(this));
    return;
  }

  $.extend(this.settings, this.tree.settings);
  this.createTemplate();

  if (this.tree.settings.doktypes && this.tree.settings.doktypes.length) {
    this.template
      .find('.tree-topbar')
      .prepend(
        `<button class="toolbar-item-link" data-tree-show-submenu="page-new" data-tree-icon-inline="actions-page-new" title="${TYPO3.lang['tree.buttonNewNode']}"></button>`,
      );

    const $submenuPageNew = this.template.find('[data-tree-submenu=page-new]');
    if ($submenuPageNew.length) {
      $.each(this.tree.settings.doktypes, (id: number, e: Doktype) => {
        this.tree.fetchIcon(e.icon, false);
        $submenuPageNew.append(
          `<div class="svg-toolbar__drag-node" data-node-type="${e.nodeType}" title="${e.title}" ><div data-tree-icon-inline="${e.icon}"></div>${e.tooltip}</div>`,
        );
      });
    }
  }

  [
    ...this.template.find('[data-tree-icon-inline]'),
    ...this.filterTemplate.find('[data-tree-icon-inline]'),
  ].map((el: HTMLElement) =>
    Icons.getIcon(el.dataset.treeIconInline, Icons.sizes.small, null, null, 'inline').done(
      (icon: string) => (el.innerHTML = icon),
    ),
  );

  const $toolbar = $(this.settings.target).append(this.template);
  $toolbar.after(this.filterTemplate);
  //get icons
  $toolbar.find('[data-tree-icon]').each(function () {
    Icons.getIcon($(this).attr('data-tree-icon'), Icons.sizes.small).done((icon: string) => $(this).append(icon));
  });

  $toolbar.find('.js-tree-refresh').on('click', this.refreshTree.bind(this));
  $toolbar.find('[data-tree-show-submenu]').on('click', (e: Event) => {
    if (e.target && e.target.dataset) {
      $toolbar.find(`[data-tree-submenu=${e.target.dataset.treeShowSubmenu}]`).toggleClass('hidden');
    }
  });

  $toolbar.find('.js-toggle-filter').on('click', () => {
    this.filterTemplate.toggleClass('hidden');
    this.tree.updateWrapperHeight();
  });

  const d3Toolbar = d3.select('.svg-toolbar');
  console.log(d3Toolbar, this.dragDrop.dragToolbar())
  $.each(this.tree.settings.doktypes, (id: number, e: Doktype) => {
    if (e.icon) {
      console.log('ds', d3Toolbar.selectAll(`[data-tree-icon=${e.icon}]`))
      d3Toolbar.selectAll(`[data-tree-icon=${e.icon}]`).call(this.dragDrop.dragToolbar());
    }
  });

  $toolbar.find(this.settings.searchInput).on('input', (e: KeyboardEvent) => {
    this.search(e.target);
  });

  $toolbar.find('[data-toggle="tooltip"]').tooltip();
};

SvgTree.prototype.setWrapperHeight = () => null;

TreeToolbar.prototype.createTemplate = function () {
  this.template = $(
    `
<div class="${this.settings.toolbarSelector}">
    <div class="tree-topbar">
        <div>
          <button class="toolbar-item-link js-tree-refresh" data-tree-icon-inline="actions-refresh"
                  title="${TYPO3.lang['labels.refresh']}"></button>

          <button class="toolbar-item-link js-toggle-filter" data-tree-icon-inline="actions-menu-alternative"
                  title="${TYPO3.lang['tree.buttonFilter']}"></button>
        </div>
    </div>
    <div class="svg-toolbar__submenu hidden" data-tree-submenu="page-new">
    </div>
</div>

 `,
  );
  this.filterTemplate = $(
    `
     <div class="tree-filter hidden">
          <div class="form-control-holder">
              <div class="form-control-icon" data-tree-icon-inline="actions-search">
              </div>

               <input type="text" class="form-control tree-filter-search-input" placeholder="${TYPO3.lang['tree.searchTermInfo']}">
          </div>
    </div>
    `,
  );
};

PageTreeElement.template = `
  <div id="typo3-pagetree" class="svg-tree">
    <div id="svg-toolbar" class="svg-toolbar"></div>
    <div id="typo3-pagetree-treeContainer">
        <div id="typo3-pagetree-tree" class="svg-tree-wrapper">
            <div class="node-loader"></div>
        </div>
    </div>
    <div class="svg-tree-loader"></div>
</div>`;
