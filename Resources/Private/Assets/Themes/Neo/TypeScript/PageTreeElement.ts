import PageTreeElement from 'TYPO3/CMS/Backend/PageTree/PageTreeElement';

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
