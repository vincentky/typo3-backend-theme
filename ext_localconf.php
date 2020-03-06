<?php
defined('TYPO3_MODE') || die();

(function () {
    // \Starfishprime\Templates\Utility\ExtensionManagementUtility::loadIconsFromPeristentConfiguration();
    $GLOBALS['TYPO3_CONF_VARS']['SYS']['features']['Templates_overrideIcons'] = true;
    $GLOBALS['TYPO3_CONF_VARS']['SYS']['Objects'][\TYPO3\CMS\Backend\Domain\Repository\Module\BackendModuleRepository::class] = [
        'className' => \Starfishprime\Templates\Domain\Repository\BackendModuleRepository::class
    ];

    $GLOBALS['TYPO3_CONF_VARS']['BE']['toolbarItems'][1435433111] = \Starfishprime\Templates\Backend\ToolbarItems\UserToolbarItem::class;

    $GLOBALS['TYPO3_CONF_VARS']['SC_OPTIONS']['typo3/backend.php']['constructPostProcess'][] = \Starfishprime\Templates\Hooks\BackendControllerHook::class . '->addJavaScript';

})();
