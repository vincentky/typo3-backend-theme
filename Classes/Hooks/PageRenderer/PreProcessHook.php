<?php
declare(strict_types=1);

namespace Starfishprime\Templates\Hooks\PageRenderer;

use TYPO3\CMS\Backend\Configuration\BackendUserConfiguration;
use TYPO3\CMS\Core\Configuration\ExtensionConfiguration;
use TYPO3\CMS\Core\Page\PageRenderer;
use TYPO3\CMS\Core\Utility\GeneralUtility;

class PreProcessHook
{
    const CSS_ROOT_VAR_TMPL = <<<EOT
:root {
  --scaffold-content-navigation-width: %spx;
  --link-browser-navigation-width: %spx;
}

EOT;

    /**
     * @param array $params
     * @param PageRenderer $pageRenderer
     * @throws \TYPO3\CMS\Core\Configuration\Exception\ExtensionConfigurationExtensionNotConfiguredException
     * @throws \TYPO3\CMS\Core\Configuration\Exception\ExtensionConfigurationPathDoesNotExistException
     */
    public function execute(array &$params, PageRenderer &$pageRenderer)
    {
        if (TYPO3_MODE === 'FE') {
            return;
        }
        $pageRenderer->loadRequireJsModule('TYPO3/CMS/Templates/PageTree');
        $pageRenderer->loadRequireJsModule('TYPO3/CMS/Templates/PageTreeElement');
        $pageRenderer->loadRequireJsModule('TYPO3/CMS/Templates/SvgTree');
        $pageRenderer->loadRequireJsModule('TYPO3/CMS/Templates/TreeToolbar');
        $pageRenderer->loadRequireJsModule('TYPO3/CMS/Templates/NavigationContainer');
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
        $pageRenderer->addCssInlineBlock('cssVariables', sprintf(self::CSS_ROOT_VAR_TMPL, $this->getUserPageTreeWidth(), $this->getUserElementBrowserTreeWidth()));
        /*$extendedJsModules = ['TYPO3/CMS/Backend/ModuleMenu'];
        foreach ($extendedJsModules as $jsModule) {
            $moduleKey = sprintf('RequireJS-Module-%s', $jsModule);
            $extendedModuleId = sprintf('TYPO3/CMS/Templates/%s', substr($jsModule, strrpos($jsModule, '/') + 1));
            $extendedModuleKey = sprintf('RequireJS-Module-%s', $extendedModuleId);
            if (isset($params['jsInline'][$moduleKey])) {
                $params['jsInline'][$extendedModuleKey] = $params['jsInline'][$moduleKey];
                unset($params['jsInline'][$moduleKey]);
                $params['jsInline'][$extendedModuleKey]['code'] = sprintf('require(["%s"],function() { console.log("Loaded own module."); })', $extendedModuleId);
            }
        }
*/
    }

    /**
     * @return BackendUserConfiguration
     */
    protected function getBackendUserConfiguration(): BackendUserConfiguration
    {
        return GeneralUtility::makeInstance(BackendUserConfiguration::class);
    }

    /**
     * @return ExtensionConfiguration
     */
    protected function getExtensionConfiguration(): ExtensionConfiguration
    {
        return GeneralUtility::makeInstance(ExtensionConfiguration::class);
    }

    /**
     * @return int
     * @throws \TYPO3\CMS\Core\Configuration\Exception\ExtensionConfigurationExtensionNotConfiguredException
     * @throws \TYPO3\CMS\Core\Configuration\Exception\ExtensionConfigurationPathDoesNotExistException
     */
    protected function getUserPageTreeWidth(): int
    {
        $value = (int)$this->getBackendUserConfiguration()->get('BackendComponents.States.Pagetree.width');
        return ($value > 0 ? $value : (int)$this->getExtensionConfiguration()->get('templates', 'defaultPageTreeWidth'));
    }

    /**
     * @return int
     * @throws \TYPO3\CMS\Core\Configuration\Exception\ExtensionConfigurationExtensionNotConfiguredException
     * @throws \TYPO3\CMS\Core\Configuration\Exception\ExtensionConfigurationPathDoesNotExistException
     */
    protected function getUserElementBrowserTreeWidth(): int
    {
        $value = (int)$this->getBackendUserConfiguration()->get('BackendComponents.States.Pagetree.Browser.width');
        return ($value > 0 ? $value : (int)$this->getExtensionConfiguration()->get('templates', 'defaultLinkBrowserTreeWidth'));
    }
}
