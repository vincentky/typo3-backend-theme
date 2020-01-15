<?php
defined('TYPO3_MODE') || die();

(function () {
    // Register the backend module
    \TYPO3\CMS\Extbase\Utility\ExtensionUtility::registerModule(
        'Templates',
        'system',
        'templates',
        '',
        [
            \Starfishprime\Templates\Controller\BackendController::class => 'index, icons, uploadIcon',
        ],
        [
            'access' => 'user,group',
            'icon' => 'EXT:templates/Resources/Public/Icons/module.svg',
            'labels' => 'LLL:EXT:templates/Resources/Private/Language/locallang.xlf'
        ]
    );

    $GLOBALS['TBE_STYLES']['skins']['backend']['stylesheetDirectories']['templates'] = 'EXT:templates/Resources/Public/Css/';
})();
