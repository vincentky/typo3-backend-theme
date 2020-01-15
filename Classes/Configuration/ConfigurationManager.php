<?php
declare(strict_types = 1);

namespace Starfishprime\Templates\Configuration;

use Symfony\Component\Yaml\Exception\ParseException;
use Symfony\Component\Yaml\Yaml;
use TYPO3\CMS\Core\Cache\CacheManager;
use TYPO3\CMS\Core\Cache\Exception\NoSuchCacheException;
use TYPO3\CMS\Core\Configuration\Loader\YamlFileLoader;
use TYPO3\CMS\Core\Resource\Exception\FileDoesNotExistException;
use TYPO3\CMS\Core\Resource\File;
use TYPO3\CMS\Core\TypoScript\TypoScriptService;
use TYPO3\CMS\Core\Utility\ArrayUtility;
use TYPO3\CMS\Extbase\Configuration\ConfigurationManager as ExtbaseConfigurationManager;
use TYPO3\CMS\Extbase\Configuration\Exception\InvalidConfigurationTypeException;
use TYPO3\CMS\Extbase\Configuration\Exception\ParseErrorException;

/**
 * Extend the ExtbaseConfigurationManager to read YAML configurations.
 */
class ConfigurationManager extends ExtbaseConfigurationManager implements ConfigurationManagerInterface
{

    /**
     * @var CacheManager
     */
    protected CacheManager $cacheManager;

    /**
     * @var TypoScriptService
     */
    protected TypoScriptService $typoScriptService;

    /**
     * @param YamlFileLoader $yamlFileLoader
     */
    public function injectYamlFileLoader(YamlFileLoader $yamlFileLoader)
    {
        $this->yamlFileLoader = $yamlFileLoader;
    }

    /**
     * @param TypoScriptService $typoScriptService
     */
    public function injectTypoScriptService(TypoScriptService $typoScriptService)
    {
        $this->typoScriptService = $typoScriptService;
    }

    /**
     * @param CacheManager $cacheManager
     */
    public function injectCacheManager(CacheManager $cacheManager)
    {
        $this->cacheManager = $cacheManager;
    }

    /**
     * @param string $configurationType The kind of configuration to fetch - must be one of the CONFIGURATION_TYPE_* constants
     * @param string $extensionName if specified, the configuration for the given extension will be returned.
     * @param string $pluginName if specified, the configuration for the given plugin will be returned.
     * @return array The configuration
     * @throws InvalidConfigurationTypeException
     * @throws NoSuchCacheException
     */
    public function getConfiguration(string $configurationType, string $extensionName = null, string $pluginName = null): array
    {
        switch ($configurationType) {
            case self::CONFIGURATION_TYPE_YAML_SETTINGS:
                return $this->getConfigurationFromYamlFile($extensionName);
            default:
                return parent::getConfiguration($configurationType, $extensionName, $pluginName);
        }
    }

    /**
     * Load and parse YAML files which are configured within the TypoScript
     * path plugin.tx_extensionkey.settings.yaml
     *
     * The following steps will be done:
     *
     * * Convert each single YAML file into an array
     * * merge this arrays together
     * * resolve all declared inheritances
     * * remove all keys if their values are NULL
     * * return all configuration paths within TYPO3.CMS
     * * sort by array keys, if all keys within the current nesting level are numerical keys
     * * resolve possible TypoScript settings in FE mode
     *
     * @param string $extensionName
     * @return array
     * @throws InvalidConfigurationTypeException
     * @throws NoSuchCacheException
     */
    protected function getConfigurationFromYamlFile(string $extensionName = ''): array
    {
        $ucFirstExtensioName = ucfirst($extensionName);

        $typoscriptSettings = $this->getTypoScriptSettings($extensionName);

        $yamlSettingsFilePaths = isset($typoscriptSettings['yaml'])
            ? ArrayUtility::sortArrayWithIntegerKeys($typoscriptSettings['yaml'])
            : [];

        $cacheKeySuffix = $extensionName . md5(json_encode($yamlSettingsFilePaths));

        $yamlSettings = $this->getYamlSettingsFromCache($cacheKeySuffix);
        if (!empty($yamlSettings)) {
            return $this->overrideConfigurationByTypoScript($yamlSettings, $extensionName);
        }

        $yamlSettings = $this->loadYamlFiles($yamlSettingsFilePaths);

        $yamlSettings = ArrayUtility::removeNullValuesRecursive($yamlSettings);

        $yamlSettings = ArrayUtility::sortArrayWithIntegerKeysRecursive($yamlSettings);
        $this->setYamlSettingsIntoCache($cacheKeySuffix, $yamlSettings);

        return $this->overrideConfigurationByTypoScript($yamlSettings, $extensionName);
    }

    /**
     * @param string $extensionName
     * @return array
     * @throws InvalidConfigurationTypeException
     */
    protected function getTypoScriptSettings(string $extensionName)
    {
        return parent::getConfiguration(
            ConfigurationManagerInterface::CONFIGURATION_TYPE_SETTINGS,
            $extensionName
        );
    }

    /**
     * @param string $cacheKeySuffix
     * @return mixed
     * @throws NoSuchCacheException
     */
    protected function getYamlSettingsFromCache(string $cacheKeySuffix)
    {
        return $this->cacheManager->getCache('assets')->get(
            $this->getConfigurationCacheKey($cacheKeySuffix)
        );
    }

    /**
     * @param string $cacheKeySuffix
     * @return string
     */
    protected function getConfigurationCacheKey(string $cacheKeySuffix): string
    {
        return strtolower(self::CONFIGURATION_TYPE_YAML_SETTINGS . '_' . $cacheKeySuffix);
    }

    /**
     * @param array $yamlSettings
     * @param string $extensionName
     * @return array
     * @throws InvalidConfigurationTypeException
     */
    protected function overrideConfigurationByTypoScript(array $yamlSettings, string $extensionName): array
    {
        $typoScript = parent::getConfiguration(self::CONFIGURATION_TYPE_SETTINGS, $extensionName);
        if (is_array($typoScript['yamlSettingsOverrides']) && !empty($typoScript['yamlSettingsOverrides'])) {
            ArrayUtility::mergeRecursiveWithOverrule(
                $yamlSettings,
                $typoScript['yamlSettingsOverrides']
            );

            if ($this->environmentService->isEnvironmentInFrontendMode()) {
                $yamlSettings = $this->typoScriptService
                    ->resolvePossibleTypoScriptConfiguration($yamlSettings);
            }
        }
        return $yamlSettings;
    }

    /**
     * @param string $cacheKeySuffix
     * @param array $yamlSettings
     * @throws NoSuchCacheException
     */
    protected function setYamlSettingsIntoCache(
        string $cacheKeySuffix,
        array $yamlSettings
    ) {
        $this->cacheManager->getCache('assets')->set(
            $this->getConfigurationCacheKey($cacheKeySuffix),
            $yamlSettings
        );
    }

    /**
     * @param array $files
     * @return array
     * @throws FileDoesNotExistException
     * @throws ParseErrorException
     */
    protected function loadYamlFiles(array $files)
    {
        $configuration = [];

        foreach ($files as $file) {
            if ($file instanceof File) {
                $loadedConfiguration = $this->loadFromFile($file);
            } else {
                $loadedConfiguration = $this->loadFromFilePath($file);
            }

            if (is_array($loadedConfiguration)) {
                $configuration = array_replace_recursive($configuration, $loadedConfiguration);
            }
        }

        $configuration = ArrayUtility::convertBooleanStringsToBooleanRecursive($configuration);

        return $configuration;
    }

    /**
     * Load YAML configuration from a File
     *
     * @throws ParseErrorException
     * @throws FileDoesNotExistException
     */
    protected function loadFromFile(File $file): array
    {
        $fileIdentifier = $file->getIdentifier();
        $rawYamlContent = $file->getContents();

        if ($rawYamlContent === false) {
            throw new FileDoesNotExistException(
                sprintf('The file "%s" does not exist', $fileIdentifier),
                1492804251
            );
        }

        try {
            $loadedConfiguration = Yaml::parse($rawYamlContent);
        } catch (ParseException $e) {
            throw new ParseErrorException(
                sprintf('An error occurred while parsing file "%s": %s', $fileIdentifier, $e->getMessage()),
                1578490322,
                $e
            );
        }

        return $loadedConfiguration;
    }

    /**
     * Load YAML configuration from a local file path
     *
     * @throws ParseErrorException
     */
    protected function loadFromFilePath(string $filePath): array
    {
        try {
            $loadedConfiguration = $this->yamlFileLoader->load($filePath);
        } catch (\RuntimeException $e) {
            throw new ParseErrorException(
                sprintf('An error occurred while parsing file "%s": %s', $filePath, $e->getMessage()),
                1480195405,
                $e
            );
        }

        return $loadedConfiguration;
    }
}
