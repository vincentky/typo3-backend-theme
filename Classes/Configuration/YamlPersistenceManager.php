<?php
declare(strict_types = 1);

namespace Starfishprime\Templates\Configuration;

use Starfishprime\Templates\Configuration\Exception\StorageUnavailableException;
use Symfony\Component\Yaml\Yaml;
use TYPO3\CMS\Core\Configuration\Loader\YamlFileLoader;
use TYPO3\CMS\Core\Resource\Exception\FileOperationErrorException;
use TYPO3\CMS\Core\Resource\Exception\IllegalFileExtensionException;
use TYPO3\CMS\Core\Resource\Exception\InsufficientFolderWritePermissionsException;
use TYPO3\CMS\Core\Resource\Exception\InvalidFolderException;
use TYPO3\CMS\Core\Resource\File;
use TYPO3\CMS\Core\Resource\ResourceStorage;
use TYPO3\CMS\Core\Resource\StorageRepository;
use TYPO3\CMS\Core\Utility\GeneralUtility;
use TYPO3\CMS\Core\Utility\PathUtility;
use TYPO3\CMS\Core\Utility\StringUtility;
use TYPO3\CMS\Extbase\Configuration\Exception\ParseErrorException;

class YamlPersistenceManager implements ConfigurationPersistenceManagerInterface
{
    /**
     * @var YamlFileLoader
     */
    protected YamlFileLoader $yamlFileLoader;

    /**
     * @var StorageRepository
     */
    protected StorageRepository $storageRepository;

    /**
     * @param StorageRepository $storageRepository
     */
    public function injectStorageRepository(StorageRepository $storageRepository)
    {
        $this->storageRepository = $storageRepository;
    }

    /**
     * @param YamlFileLoader $yamlFileLoader
     */
    public function injectYamlFileLoader(YamlFileLoader $yamlFileLoader)
    {
        $this->yamlFileLoader = $yamlFileLoader;
    }

    /**
     * @inheritDoc
     */
    public function load($persistenceIdentifier): array
    {
        try {
            $loadedConfiguration = $this->yamlFileLoader->load($persistenceIdentifier);
        } catch (\RuntimeException $e) {
            throw new ParseErrorException(
                sprintf('An error occurred while parsing file "%s": %s', $persistenceIdentifier, $e->getMessage()),
                1420195431,
                $e
            );
        }

        return $loadedConfiguration;
    }

    /**
     * @inheritDoc
     */
    public function getFileExtension(): string
    {
        return 'yaml';
    }

    /**
     * @inheritDoc
     */
    public function write(string $persistenceIdentifier, array $configuration): void
    {
        if (!$this->hasValidFileExtension($persistenceIdentifier)) {
            throw new IllegalFileExtensionException(sprintf('The file "%s" could not be saved.', $persistenceIdentifier), 12744679820);
        }

        if (strpos($persistenceIdentifier, 'EXT:') === 0) {
            $fileToSave = GeneralUtility::getFileAbsFileName($persistenceIdentifier);
        } else {
            $fileToSave = $this->getOrCreateFile($persistenceIdentifier);
        }

        $header = $this->getHeaderFromFile($fileToSave);

        $yaml = Yaml::dump($configuration, 99, 2);

        if ($fileToSave instanceof File) {
            $fileToSave->setContents($header . LF . $yaml);
        } else {
            $byteCount = @file_put_contents($fileToSave, $header . LF . $yaml);

            if ($byteCount === false) {
                $error = error_get_last();
                throw new FileOperationErrorException($error['message'], 1512582929);
            }
        }
    }

    /**
     * Read the header part from the given file. That means, every line
     * until the first non comment line is found.
     *
     * @param File|string $file
     * @return string The header of the given YAML file
     */
    protected function getHeaderFromFile($file): string
    {
        if ($file instanceof File) {
            $lines = explode(LF, $file->getContents());
        } elseif (is_file($file)) {
            $lines = file($file);
        } else {
            return '';
        }

        $header = '';

        foreach ($lines as $line) {
            if (preg_match('/^#/', $line)) {
                $header .= $line;
            } else {
                break;
            }
        }
        return $header;
    }

    /**
     * @param string $fileName
     * @return bool
     */
    protected function hasValidFileExtension(string $fileName): bool
    {
        return StringUtility::endsWith($fileName, $this->getFileExtension());
    }

    /**
     * @param string $persistenceIdentifier
     * @return File
     * @throws InsufficientFolderWritePermissionsException
     * @throws InvalidFolderException
     * @throws \TYPO3\CMS\Core\Resource\Exception\InsufficientFolderAccessPermissionsException
     * @throws \TYPO3\CMS\Core\Resource\Exception\InsufficientFolderReadPermissionsException
     */
    protected function getOrCreateFile(string $persistenceIdentifier): File
    {
        list($storageUid, $fileIdentifier) = explode(':', $persistenceIdentifier, 2);
        $storage = $this->getStorageByUid((int)$storageUid);
        $pathinfo = PathUtility::pathinfo($fileIdentifier);

        if (!$storage->hasFolder($pathinfo['dirname'])) {
            throw new InvalidFolderException(sprintf('Could not create folder "%s".', $pathinfo['dirname']), 1471630579);
        }

        $folder = $storage->getFolder($pathinfo['dirname']);

        if (!$storage->checkFolderActionPermission('write', $folder)) {
            throw new InsufficientFolderWritePermissionsException(sprintf('No write access to folder "%s".', $pathinfo['dirname']), 1471630580);
        }

        if (!$storage->hasFile($fileIdentifier)) {
            $file = $folder->createFile($pathinfo['basename']);
        } else {
            $file = $storage->getFile($fileIdentifier);
        }
        return $file;
    }

    /**
     * Returns a ResourceStorage for a given uid
     *
     * @param int $storageUid
     * @return ResourceStorage
     * @throws PersistenceManagerException
     * @throws StorageUnavailableException
     */
    protected function getStorageByUid(int $storageUid): ResourceStorage
    {
        $storage = $this->storageRepository->findByUid($storageUid);
        if (
            !$storage instanceof ResourceStorage
            || !$storage->isBrowsable()
        ) {
            throw new StorageUnavailableException(sprintf('Could not access storage with uid "%d".', $storageUid), 1431631781);
        }
        return $storage;
    }
}
