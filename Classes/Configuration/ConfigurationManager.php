<?php
declare(strict_types = 1);

namespace Starfishprime\Templates\Configuration;

use TYPO3\CMS\Core\Cache\CacheManager;
use TYPO3\CMS\Core\Cache\Exception\NoSuchCacheException;
use TYPO3\CMS\Core\Resource\Exception\FileDoesNotExistException;
use TYPO3\CMS\Core\Resource\Exception\InvalidFileNameException;
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

    protected ConfigurationPersistenceManagerInterface $configurationPersistenceManager;

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
     * @param ConfigurationPersistenceManagerInterface $configurationPersistenceManager
     */
    public function injectConfigurationPersistenceManager(ConfigurationPersistenceManagerInterface $configurationPersistenceManager)
    {
        $this->configurationPersistenceManager = $configurationPersistenceManager;
    }

    /**
     * @param string $configurationType
     * @param string $extensionName
     * @param string|null $pluginName
     * @return array
     * @throws FileDoesNotExistException
     * @throws InvalidConfigurationTypeException
     * @throws NoSuchCacheException
     * @throws ParseErrorException
     */
    public function getConfiguration(string $configurationType, string $extensionName = null, string $pluginName = null): array
    {
        switch ($configurationType) {
            case self::CONFIGURATION_TYPE_FILE_SETTINGS:
                return $this->getConfigurationFromFile($extensionName);
            default:
                return parent::getConfiguration($configurationType, $extensionName, $pluginName);
        }
    }

    /**
     * @param string $extensionName
     * @return string
     */
    protected function getCacheKeySuffix(string $extensionName = ''): string
    {
        return ucfirst($extensionName) . md5(json_encode($extensionName));
    }

    /**
     * @param string $extensionName
     * @return array
     * @throws InvalidConfigurationTypeException
     */
    protected function getSettingsFileIdentifier(string $extensionName): array
    {
        $typoscriptSettings = $this->getTypoScriptSettings($extensionName);

        return isset($typoscriptSettings['import'])
            ? ArrayUtility::sortArrayWithIntegerKeys($typoscriptSettings['import'])
            : [];
    }

    /**
     * Load and parse YAML files which are configured within the TypoScript
     * path plugin.tx_extensionkey.settings.yaml
     *
     * @param string $extensionName
     * @return array
     * @throws FileDoesNotExistException
     * @throws InvalidConfigurationTypeException
     * @throws NoSuchCacheException
     * @throws ParseErrorException
     */
    protected function getConfigurationFromFile(string $extensionName = 'Templates'): array
    {
        $settings = $this->getSettingsFromCache($extensionName);

        if (!empty($settings)) {
            return $settings;
        }

        $settings = $this->loadConfigurationFiles($this->getSettingsFileIdentifier($extensionName));

        $settings = ArrayUtility::removeNullValuesRecursive($settings);

        $settings = ArrayUtility::sortArrayWithIntegerKeysRecursive($settings);
        $this->setFileSettingsIntoCache($extensionName, $settings);

        return $settings;
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
     * @param string $extensionName
     * @return mixed
     * @throws InvalidConfigurationTypeException
     * @throws NoSuchCacheException
     */
    protected function getSettingsFromCache(string $extensionName)
    {
        return $this->cacheManager->getCache('assets')->get(
            $this->getConfigurationCacheKey($extensionName)
        );
    }

    /**
     * @param string $extensionName
     * @return string
     * @throws InvalidConfigurationTypeException
     */
    protected function getConfigurationCacheKey(string $extensionName): string
    {
        return strtolower(sprintf('%ssettings_%s%s', self::CONFIGURATION_TYPE_FILE_SETTINGS, $extensionName, sha1(json_encode($this->getSettingsFileIdentifier($extensionName)))));
    }

    /**
     * @param string $extensionName
     * @param array $settings
     * @throws InvalidConfigurationTypeException
     * @throws NoSuchCacheException
     */
    protected function setFileSettingsIntoCache(
        string $extensionName,
        array $settings
    ) {
        $this->cacheManager->getCache('assets')->set(
            $this->getConfigurationCacheKey($extensionName),
            $settings
        );
    }

    /**
     * @param array $files
     * @return array
     * @throws FileDoesNotExistException
     * @throws ParseErrorException
     */
    protected function loadConfigurationFiles(array $files)
    {
        $configuration = [];

        foreach ($files as $file) {
            $loadedConfiguration = $this->configurationPersistenceManager->load($file);

            if (is_array($loadedConfiguration)) {
                $configuration = array_replace_recursive($configuration, $loadedConfiguration);
            }
        }

        $configuration = ArrayUtility::convertBooleanStringsToBooleanRecursive($configuration);

        return $configuration;
    }

    /**
     * @param string $namespace
     * @param array $data
     * @param string $extensionName
     * @throws FileDoesNotExistException
     * @throws InvalidConfigurationTypeException
     * @throws InvalidFileNameException
     * @throws NoSuchCacheException
     * @throws ParseErrorException
     */
    public function writeConfiguration(string $namespace, array $data, string $extensionName = 'Templates'): void
    {
        $settings = $this->getConfigurationFromFile($extensionName);
        ArrayUtility::mergeRecursiveWithOverrule($settings, [$namespace => $data]);
        if (empty($settings['persistence']['path'])) {
            throw new InvalidFileNameException(
                'No filename',
                1493932874
            );
        }

        $this->configurationPersistenceManager->write(sprintf('%s/%s.%s', trim($settings['persistence']['path'], '/'), $namespace, $this->configurationPersistenceManager->getFileExtension()), $settings[$namespace]);

        $this->setFileSettingsIntoCache($extensionName, $settings);
    }
}
