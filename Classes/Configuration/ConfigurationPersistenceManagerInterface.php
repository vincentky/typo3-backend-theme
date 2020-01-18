<?php
declare(strict_types = 1);

namespace Starfishprime\Templates\Configuration;

interface ConfigurationPersistenceManagerInterface
{

    /**
     * Load the configuration and return it in an array
     *
     * @param string $persistenceIdentifier
     * @return array
     */
    public function load(string $persistenceIdentifier): array;

    /**
     * Add or update a configuration
     *
     * @param string $persistenceIdentifier
     * @param array $configuration
     */
    public function write(string $persistenceIdentifier, array $configuration): void;

    /**
     * Return file extension
     *
     * @return string
     */
    public function getFileExtension(): string;
}
