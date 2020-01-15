<?php
declare(strict_types = 1);
namespace Starfishprime\Templates\Configuration;

use TYPO3\CMS\Extbase\Configuration\ConfigurationManagerInterface as ExtbaseConfigurationManagerInterface;

/**
 * Class ConfigurationManagerInterface
 *
 * Scope: frontend / backend
 */
interface ConfigurationManagerInterface extends ExtbaseConfigurationManagerInterface
{
    const CONFIGURATION_TYPE_YAML_SETTINGS = 'Yaml';
}
