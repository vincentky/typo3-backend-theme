<?php
declare(strict_types=1);

namespace TYPO3\CMS\Core\Tests\Functional\Category\Collection;

/*
 * This file is part of the TYPO3 CMS project.
 *
 * It is free software; you can redistribute it and/or modify it under
 * the terms of the GNU General Public License, either version 2
 * of the License, or any later version.
 *
 * For the full copyright and license information, please read the
 * LICENSE.txt file that was distributed with this source code.
 *
 * The TYPO3 project - inspiring people to share!
 */

use Doctrine\DBAL\Schema\AbstractSchemaManager;
use Doctrine\DBAL\Schema\Table;
use Doctrine\DBAL\Types\BigIntType;
use Doctrine\DBAL\Types\IntegerType;
use TYPO3\CMS\Core\Database\ConnectionPool;
use TYPO3\CMS\Core\Database\Schema\SchemaMigrator;
use TYPO3\CMS\Core\Database\Schema\SqlReader;
use TYPO3\CMS\Core\Tests\FunctionalTestCase;
use TYPO3\CMS\Core\Utility\GeneralUtility;

/**
 * Test case for \TYPO3\CMS\Core\Database\Schema\SchemaMigrationServiceTest
 */
class SchemaMigrationServiceTest extends FunctionalTestCase
{
    /**
     * @var SqlReader
     */
    protected $sqlReader;

    /**
     * @var ConnectionPool
     */
    protected $connectionPool;

    /**
     * @var AbstractSchemaManager
     */
    protected $schemaManager;

    /**
     * @var \TYPO3\CMS\Core\Database\Schema\SchemaMigrator
     */
    protected $subject;

    /**
     * @var string
     */
    protected $tableName = 'aTestTable';

    /**
     * Sets up this test suite.
     *
     * @return void
     */
    protected function setUp()
    {
        parent::setUp();
        $this->subject = GeneralUtility::makeInstance(SchemaMigrator::class);
        $this->sqlReader = GeneralUtility::makeInstance(SqlReader::class);
        $this->connectionPool = GeneralUtility::makeInstance(ConnectionPool::class);
        $this->schemaManager = $this->connectionPool->getConnectionForTable($this->tableName)->getSchemaManager();
        $this->prepareTestTable();
    }

    /**
     * Tears down this test suite.
     */
    protected function tearDown()
    {
        parent::tearDown();

        if ($this->schemaManager->tablesExist([$this->tableName])) {
            $this->schemaManager->dropTable($this->tableName);
        }
        if ($this->schemaManager->tablesExist(['zzz_deleted_' . $this->tableName])) {
            $this->schemaManager->dropTable('zzz_deleted_' . $this->tableName);
        }
        if ($this->schemaManager->tablesExist(['anotherTestTable'])) {
            $this->schemaManager->dropTable('anotherTestTable');
        }
    }

    /**
     * @test
     */
    public function createNewTable()
    {
        if ($this->schemaManager->tablesExist([$this->tableName])) {
            $this->schemaManager->dropTable($this->tableName);
        }

        $statements = $this->readFixtureFile('newTable');
        $updateSuggestions = $this->subject->getUpdateSuggestions($statements);

        $this->subject->migrate(
            $statements,
            $updateSuggestions[ConnectionPool::DEFAULT_CONNECTION_NAME]['create_table']
        );

        $this->assertCount(5, $this->getTableDetails()->getColumns());
    }

    /**
     * @test
     */
    public function createNewTableIfNotExists()
    {
        $statements = $this->readFixtureFile('ifNotExists');
        $updateSuggestions = $this->subject->getUpdateSuggestions($statements);

        $this->subject->migrate(
            $statements,
            $updateSuggestions[ConnectionPool::DEFAULT_CONNECTION_NAME]['create_table']
        );

        $this->assertTrue($this->schemaManager->tablesExist(['anotherTestTable']));
    }

    /**
     * @test
     */
    public function addNewColumns()
    {
        $statements = $this->readFixtureFile('addColumnsToTable');
        $updateSuggestions = $this->subject->getUpdateSuggestions($statements);

        $this->subject->migrate(
            $statements,
            $updateSuggestions[ConnectionPool::DEFAULT_CONNECTION_NAME]['add']
        );

        $this->assertCount(7, $this->getTableDetails()->getColumns());
        $this->assertTrue($this->getTableDetails()->hasColumn('title'));
        $this->assertTrue($this->getTableDetails()->hasColumn('description'));
    }

    /**
     * @test
     */
    public function changeExistingColumn()
    {
        $statements = $this->readFixtureFile('changeExistingColumn');
        $updateSuggestions = $this->subject->getUpdateSuggestions($statements);

        $this->assertInstanceOf(IntegerType::class, $this->getTableDetails()->getColumn('uid')->getType());
        $this->assertTrue($this->getTableDetails()->getColumn('uid')->getUnsigned());

        $this->subject->migrate(
            $statements,
            $updateSuggestions[ConnectionPool::DEFAULT_CONNECTION_NAME]['change']
        );

        $this->assertInstanceOf(BigIntType::class, $this->getTableDetails()->getColumn('uid')->getType());
        $this->assertFalse($this->getTableDetails()->getColumn('uid')->getUnsigned());
    }

    /**
     * @test
     */
    public function notNullWithoutDefaultValue()
    {
        $statements = $this->readFixtureFile('notNullWithoutDefaultValue');
        $updateSuggestions = $this->subject->getUpdateSuggestions($statements);

        $this->subject->migrate(
            $statements,
            $updateSuggestions[ConnectionPool::DEFAULT_CONNECTION_NAME]['add']
        );

        $updateSuggestions = $this->subject->getUpdateSuggestions($statements);
        $this->assertEmpty($updateSuggestions[ConnectionPool::DEFAULT_CONNECTION_NAME]['change']);
        $this->assertTrue($this->getTableDetails()->getColumn('aTestField')->getNotnull());
    }

    /**
     * @test
     */
    public function defaultNullWithoutNotNull()
    {
        $statements = $this->readFixtureFile('defaultNullWithoutNotNull');
        $updateSuggestions = $this->subject->getUpdateSuggestions($statements);

        $this->subject->migrate(
            $statements,
            $updateSuggestions[ConnectionPool::DEFAULT_CONNECTION_NAME]['add']
        );

        $updateSuggestions = $this->subject->getUpdateSuggestions($statements);
        $this->assertEmpty($updateSuggestions[ConnectionPool::DEFAULT_CONNECTION_NAME]['change']);
        $this->assertFalse($this->getTableDetails()->getColumn('aTestField')->getNotnull());
        $this->assertNull($this->getTableDetails()->getColumn('aTestField')->getDefault());
    }

    /**
     * @test
     */
    public function renameUnusedField()
    {
        $statements = $this->readFixtureFile('unusedColumn');
        $updateSuggestions = $this->subject->getUpdateSuggestions($statements, true);

        $this->subject->migrate(
            $statements,
            $updateSuggestions[ConnectionPool::DEFAULT_CONNECTION_NAME]['change']
        );

        $this->assertFalse($this->getTableDetails()->hasColumn('hidden'));
        $this->assertTrue($this->getTableDetails()->hasColumn('zzz_deleted_hidden'));
    }

    /**
     * @test
     */
    public function renameUnusedTable()
    {
        $statements = $this->readFixtureFile('unusedTable');
        $updateSuggestions = $this->subject->getUpdateSuggestions($statements, true);

        $this->subject->migrate(
            $statements,
            $updateSuggestions[ConnectionPool::DEFAULT_CONNECTION_NAME]['change_table']
        );

        $this->assertNotContains($this->tableName, $this->schemaManager->listTableNames());
        $this->assertContains('zzz_deleted_' . $this->tableName, $this->schemaManager->listTableNames());
    }

    /**
     * @test
     */
    public function dropUnusedField()
    {
        $connection = $this->connectionPool->getConnectionForTable($this->tableName);
        $fromSchema = $this->schemaManager->createSchema();
        $toSchema = clone $fromSchema;
        $toSchema->getTable($this->tableName)->addColumn('zzz_deleted_testfield', 'integer');
        $statements = $fromSchema->getMigrateToSql(
            $toSchema,
            $connection->getDatabasePlatform()
        );
        $connection->executeUpdate($statements[0]);
        $this->assertTrue($this->getTableDetails()->hasColumn('zzz_deleted_testfield'));

        $statements = $this->readFixtureFile('newTable');
        $updateSuggestions = $this->subject->getUpdateSuggestions($statements, true);
        $this->subject->migrate(
            $statements,
            $updateSuggestions[ConnectionPool::DEFAULT_CONNECTION_NAME]['drop']
        );

        $this->assertFalse($this->getTableDetails()->hasColumn('zzz_deleted_testfield'));
    }

    /**
     * @test
     */
    public function dropUnusedTable()
    {
        $this->schemaManager->renameTable($this->tableName, 'zzz_deleted_' . $this->tableName);
        $this->assertNotContains($this->tableName, $this->schemaManager->listTableNames());
        $this->assertContains('zzz_deleted_' . $this->tableName, $this->schemaManager->listTableNames());

        $statements = $this->readFixtureFile('newTable');
        $updateSuggestions = $this->subject->getUpdateSuggestions($statements, true);
        $this->subject->migrate(
            $statements,
            $updateSuggestions[ConnectionPool::DEFAULT_CONNECTION_NAME]['drop_table']
        );

        $this->assertNotContains($this->tableName, $this->schemaManager->listTableNames());
        $this->assertNotContains('zzz_deleted_' . $this->tableName, $this->schemaManager->listTableNames());
    }

    /**
     * @test
     */
    public function installPerformsOnlyAddAndCreateOperations()
    {
        $statements = $this->readFixtureFile('addCreateChange');
        $this->subject->install($statements, true);

        $this->assertContains('anotherTestTable', $this->schemaManager->listTableNames());
        $this->assertTrue($this->getTableDetails()->hasColumn('title'));
        $this->assertTrue($this->getTableDetails()->hasIndex('title'));
        $this->assertTrue($this->getTableDetails()->getIndex('title')->isUnique());
        $this->assertNotInstanceOf(BigIntType::class, $this->getTableDetails()->getColumn('pid')->getType());
    }

    /**
     * @test
     */
    public function installCanPerformChangeOperations()
    {
        $statements = $this->readFixtureFile('addCreateChange');
        $this->subject->install($statements);

        $this->assertContains('anotherTestTable', $this->schemaManager->listTableNames());
        $this->assertTrue($this->getTableDetails()->hasColumn('title'));
        $this->assertTrue($this->getTableDetails()->hasIndex('title'));
        $this->assertTrue($this->getTableDetails()->getIndex('title')->isUnique());
        $this->assertInstanceOf(BigIntType::class, $this->getTableDetails()->getColumn('pid')->getType());
    }

    /**
     * @test
     */
    public function importStaticDataInsertsRecords()
    {
        $sqlCode = file_get_contents(implode(DIRECTORY_SEPARATOR, [__DIR__, '..', 'Fixtures', 'importStaticData.sql']));
        $connection = $this->connectionPool->getConnectionForTable($this->tableName);
        $statements = $this->sqlReader->getInsertStatementArray($sqlCode);
        $this->subject->importStaticData($statements);

        $this->assertEquals(2, $connection->count('*', $this->tableName, []));
    }

    /**
     * @test
     */
    public function importStaticDataIgnoresTableDefinitions()
    {
        $sqlCode = file_get_contents(implode(DIRECTORY_SEPARATOR, [__DIR__, '..', 'Fixtures', 'importStaticData.sql']));
        $statements = $this->sqlReader->getStatementArray($sqlCode);
        $this->subject->importStaticData($statements);

        $this->assertNotContains('anotherTestTable', $this->schemaManager->listTableNames());
    }

    /**
     * Create the base table for all migration tests
     */
    protected function prepareTestTable()
    {
        $statements = $this->readFixtureFile('newTable');
        $this->subject->install($statements, true);
    }

    /**
     * Helper to return the Doctrine Table object for the test table
     *
     * @return \Doctrine\DBAL\Schema\Table
     */
    protected function getTableDetails(): Table
    {
        return $this->schemaManager->listTableDetails($this->tableName);
    }

    /**
     * Helper to read a fixture SQL file and convert it into a statement array.
     *
     * @param string $fixtureName
     * @return array
     */
    protected function readFixtureFile(string $fixtureName): array
    {
        $sqlCode = file_get_contents(implode(DIRECTORY_SEPARATOR, [__DIR__, '..', 'Fixtures', $fixtureName]) . '.sql');

        return $this->sqlReader->getCreateTableStatementArray($sqlCode);
    }
}
