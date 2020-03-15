<?php
declare(strict_types=1);

namespace Starfishprime\Templates\Hooks\Backend;

use TYPO3\CMS\Core\Page\PageRenderer;

class DocumentTemplateHook
{
    /**
     * @param array $parameters
     * @param \TYPO3\CMS\Backend\Template\DocumentTemplate $parent
     * @return void
     */
    public function preHeaderRenderHook(array $parameters, \TYPO3\CMS\Backend\Template\DocumentTemplate $parent)
    {
        /** @var PageRenderer $pageRenderer */
        $pageRenderer = $parameters['pageRenderer'];

        if ($parent->scriptID === 'rte/wizard/browselinks') {
            if ($width = $this->getUserElementBrowserTreeWidth()) {
                $pageRenderer->addCssInlineBlock('wazum/pagetree-resizable', '
                .element-browser .element-browser-main .element-browser-main-sidebar {
                    width: ' . $width . 'px;
                }
            ');
            }
        } else {
            if ($width = $this->getUserPageTreeWidth()) {
                $pageRenderer->addCssInlineBlock('wazum/pagetree-resizable', '
                .scaffold-content-navigation-expanded .scaffold-content-navigation {
                    width: ' . $width . 'px;
                }
                .scaffold-content-navigation-expanded .scaffold-content-module {
                    left: ' . $width . 'px;
                }
            ');
            }
        }

      //  $pageRenderer->addCssFile('EXT:pagetree_resizable/Resources/Public/Stylesheet/PagetreeResizable.css');
        $pageRenderer->loadRequireJsModule('TYPO3/CMS/Templates/PagetreeResizable9');
    }

    /**
     * @return int
     */
    protected function getUserPageTreeWidth(): int
    {
        return (int)($GLOBALS['BE_USER']->uc['Backend']['PagetreeResizable']['width'] ?? 0);
    }

    /**
     * @return int
     */
    protected function getUserElementBrowserTreeWidth(): int
    {
        return (int)($GLOBALS['BE_USER']->uc['Backend']['PagetreeResizable']['Browser']['width'] ?? 0);
    }
}
