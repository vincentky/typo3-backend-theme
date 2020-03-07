<?php
declare(strict_types=1);

namespace Starfishprime\Templates\Hooks;

use TYPO3\CMS\Backend\Controller\BackendController;
use TYPO3\CMS\Core\Page\PageRenderer;
use TYPO3\CMS\Core\Utility\GeneralUtility;


class BackendControllerHook
{
    public function addJavaScript(array $configuration, BackendController $backendController): void
    {
        $pageRenderer = $this->getPageRenderer();
        $pageRenderer->loadRequireJsModule('TYPO3/CMS/Backend/Viewport', 'function(viewport) {
            viewport.doLayout = function(){viewport.NavigationContainer.cleanup(), viewport.NavigationContainer.calculateScrollbar()}
        }');
        $pageRenderer->loadRequireJsModule('TYPO3/CMS/Templates/PageTree');
    }

    /**
     * @return PageRenderer
     */
    protected function getPageRenderer(): PageRenderer
    {
        return GeneralUtility::makeInstance(PageRenderer::class);
    }
}
