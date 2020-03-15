<?php
declare(strict_types=1);

namespace Starfishprime\Templates\Hooks\PageRenderer;

use TYPO3\CMS\Core\Page\PageRenderer;

/**
 * PreProcessHook
 */
class PreProcessHook
{
    /**
     * @var \BK2K\BootstrapPackage\Service\CompileService
     */
    protected $compileService;

    /**
     * @param array $params
     * @param \TYPO3\CMS\Core\Page\PageRenderer $pagerenderer
     */
    public function execute(array &$params, PageRenderer &$pagerenderer)
    {
        /*if (TYPO3_MODE === 'FE') {
            return;
        }
        $extendedJsModules = ['TYPO3/CMS/Backend/ModuleMenu'];
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


}
