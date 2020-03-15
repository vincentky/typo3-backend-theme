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


    }

    /**
     * @return PageRenderer
     */
    protected function getPageRenderer(): PageRenderer
    {
        return GeneralUtility::makeInstance(PageRenderer::class);
    }
}
