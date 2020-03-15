<?php
declare(strict_types=1);

namespace Starfishprime\Templates\Hooks\Backend;

use TYPO3\CMS\Backend\Controller\BackendController;
use TYPO3\CMS\Core\Page\PageRenderer;
use TYPO3\CMS\Core\Utility\GeneralUtility;


class BackendControllerHook
{
    public function addJavaScript(array $configuration, BackendController $backendController): void
    {
        $pageRenderer = $this->getPageRenderer();
        $pageRenderer->addRequireJsConfiguration(
            [
                'paths' => [
                    'interactjs' => '../typo3conf/ext/templates/node_modules/interactjs/dist/interact.min',
                ],
                'shim' => [
                    'interactjs' => ['exports' => 'interactjs'],
                ],
            ]
        );
        $pageRenderer->loadRequireJsModule('TYPO3/CMS/Templates/NavigationContainer');
        $pageRenderer->loadRequireJsModule('TYPO3/CMS/Templates/PageTree');
        $pageRenderer->loadRequireJsModule('TYPO3/CMS/Templates/PageTreeElement');
        $pageRenderer->loadRequireJsModule('TYPO3/CMS/Templates/SvgTree');
        $pageRenderer->loadRequireJsModule('TYPO3/CMS/Templates/TreeToolbar');
/*      $pageRenderer->loadRequireJsModule('TYPO3/CMS/Templates/NavigationContainer', 'function() { console.log("Loadedd own module."); }');
        $pageRenderer->loadRequireJsModule('TYPO3/CMS/Templates/PageTreeElement');
        $pageRenderer->loadRequireJsModule('TYPO3/CMS/Templates/PageTree');
        $pageRenderer->loadRequireJsModule('TYPO3/CMS/Templates/NavigationContainer');
        $pageRenderer->loadRequireJsModule('TYPO3/CMS/Templates/Viewport');*/
    }

    /**
     * @return PageRenderer
     */
    protected function getPageRenderer(): PageRenderer
    {
        return GeneralUtility::makeInstance(PageRenderer::class);
    }
}
