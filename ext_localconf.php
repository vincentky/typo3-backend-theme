<?php
defined('TYPO3_MODE') || die();

(function () {
    if (TYPO3_MODE === 'BE') {
        // \Starfishprime\Templates\Utility\ExtensionManagementUtility::loadIconsFromPeristentConfiguration();
        $GLOBALS['TYPO3_CONF_VARS']['SYS']['features']['Templates_overrideIcons'] = true;
        $GLOBALS['TYPO3_CONF_VARS']['SYS']['Objects'][\TYPO3\CMS\Backend\Domain\Repository\Module\BackendModuleRepository::class] = [
            'className' => \Starfishprime\Templates\Domain\Repository\BackendModuleRepository::class
        ];
        $GLOBALS['TYPO3_CONF_VARS']['SYS']['Objects'][\TYPO3\CMS\Recordlist\Controller\RecordListController::class] = [
            'className' => \Starfishprime\Templates\Xclass\RecordListController::class
        ];

        $GLOBALS['TYPO3_CONF_VARS']['BE']['toolbarItems'][1435433111] = \Starfishprime\Templates\Backend\ToolbarItems\UserToolbarItem::class;

        $GLOBALS['TYPO3_CONF_VARS']['SC_OPTIONS']['typo3/backend.php']['constructPostProcess'][] = \Starfishprime\Templates\Hooks\Backend\BackendControllerHook::class . '->addJavaScript';

        $GLOBALS['TYPO3_CONF_VARS']['SC_OPTIONS']['t3lib/class.t3lib_pagerenderer.php']['render-preProcess'][\Starfishprime\Templates\Hooks\PageRenderer\PreProcessHook::class]
            = \Starfishprime\Templates\Hooks\PageRenderer\PreProcessHook::class . '->execute';

        \TYPO3\CMS\Core\Utility\ExtensionManagementUtility::addPageTSConfig('<INCLUDE_TYPOSCRIPT: source="FILE:EXT:templates/Configuration/TsConfig/Page/options.tsconfig">');

    }
})();
