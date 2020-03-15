import TreeToolbar from 'TYPO3/CMS/Backend/PageTree/PageTreeToolbar';
import Icons from 'TYPO3/CMS/Backend/Icons';
import PageTreeDragDrop from 'TYPO3/CMS/Backend/PageTree/PageTreeDragDrop';
import d3 = require('d3');

TreeToolbar.prototype.render = function() {
    this.tree = this.$treeWrapper.data('svgtree');

    this.dragDrop = PageTreeDragDrop;
    this.dragDrop.init(this);
    if (!this.$treeWrapper.data('svgtree-initialized') || typeof this.$treeWrapper.data('svgtree') !== 'object') {
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
                    `<div class="svg-toolbar__drag-node" data-node-type="${e.nodeType}" title="${e.title}" data-tree-icon-inline="${e.icon}"><span>${e.tooltip}</span></div>`,
                );
            });
        }
    }

    [
        ...this.template.find('[data-tree-icon-inline]'),
        ...this.filterTemplate.find('[data-tree-icon-inline]'),
    ].map((el: HTMLElement) =>
        Icons.getIcon(el.dataset.treeIconInline, Icons.sizes.small, null, null, 'inline').done(
            (icon: string) => (el.innerHTML = icon + el.innerHTML),
        ),
    );

    const $toolbar = $(this.settings.target).append(this.template);
    $toolbar.after(this.filterTemplate);
    //get icons
    $toolbar.find('[data-tree-icon').each(function() {
        Icons.getIcon($(this).attr('data-tree-icon'), Icons.sizes.small).done((icon: string) => $(this).append(icon));
    });

    $toolbar.find('.js-tree-refresh').on('click', this.refreshTree.bind(this));
    let menu = null;
    $toolbar.find('[data-tree-show-submenu]').each(function() {
        const $el = $(this);
        if ($el.length) {
            const selectedMenu = $toolbar.find(`[data-tree-submenu=${$el[0].dataset.treeShowSubmenu}]`);
            if (selectedMenu.length) {
                $el.on('click', () => {
                    if ($el.length && $el[0].dataset) {
                        selectedMenu[0].classList.toggle('hidden');
                        if (selectedMenu[0].classList.contains('hidden')) {
                            menu = null;
                        } else {
                            menu = selectedMenu[0];
                        }
                    }
                });
                window.addEventListener('click', (e: MouseEvent) => {
                    if (
                        !selectedMenu[0].contains(<Node>e.target) &&
                        !$el[0].contains(<Node>e.target) &&
                        !selectedMenu[0].classList.contains('hidden')
                    ) {
                        menu.classList.toggle('hidden');
                        menu = null;
                    }
                });
            }
        }
    });

    $toolbar.find('.js-toggle-filter').on('click', () => {
        this.filterTemplate.toggleClass('hidden');
        this.tree.updateWrapperHeight();
    });

    const d3Toolbar = d3.select('.svg-toolbar');
    $.each(this.tree.settings.doktypes, (id: number, e: Doktype) => {
        if (e.icon) {
            d3Toolbar.selectAll(`[data-tree-icon-inline=${e.icon}]`).call(this.dragDrop.dragToolbar());
        }
    });

    $toolbar.find(this.settings.searchInput).on('input', (e: KeyboardEvent) => {
        this.search(e.target);
    });

    $toolbar.find('[data-toggle="tooltip"]').tooltip();
};

TreeToolbar.prototype.createTemplate = function() {
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
