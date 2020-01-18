<?php
declare(strict_types = 1);

namespace Starfishprime\Templates\Utility;

use Starfishprime\Templates\Configuration\ConfigurationManager;
use Starfishprime\Templates\Configuration\ConfigurationManagerInterface;
use TYPO3\CMS\Core\Imaging\IconRegistry;

use TYPO3\CMS\Core\Utility\GeneralUtility;

/**
 * Extension Management functions
 *
 * This class is never instantiated, rather the methods inside is called as functions
 */
class ExtensionManagementUtility
{
    public static function loadIconsFromPeristentConfiguration(string $extensionName = 'Templates')
    {
        $settings = GeneralUtility::makeInstance(ConfigurationManager::class)->getConfiguration(ConfigurationManagerInterface::CONFIGURATION_TYPE_FILE_SETTINGS, $extensionName);
        $iconRegistry = GeneralUtility::makeInstance(IconRegistry::class);
    }
}
