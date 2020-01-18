<?php
declare(strict_types = 1);

namespace Starfishprime\Templates\Domain\Repository;

use TYPO3\CMS\Backend\Domain\Repository\Module\BackendModuleRepository as CoreBackendModuleRepository;

use TYPO3\CMS\Core\Imaging\Icon;
use TYPO3\CMS\Core\Imaging\IconFactory;
use TYPO3\CMS\Core\Imaging\IconRegistry;
use TYPO3\CMS\Core\Utility\GeneralUtility;

class BackendModuleRepository extends CoreBackendModuleRepository
{
    /**
     * @param string $moduleKey
     * @param array $moduleData
     * @return string
     */
    protected function getModuleIcon($moduleKey, $moduleData)
    {
        $iconIdentifier = !empty($moduleData['iconIdentifier'])
            ? $moduleData['iconIdentifier']
            : 'module-icon-' . $moduleKey;
        $iconRegistry = GeneralUtility::makeInstance(IconRegistry::class);
        if ($iconRegistry->isRegistered($iconIdentifier)) {
            $iconFactory = GeneralUtility::makeInstance(IconFactory::class);
            return $iconFactory->getIcon($iconIdentifier, isset($moduleData['sub']) ? Icon::SIZE_DEFAULT : Icon::SIZE_SMALL)->render('inline');
        }
        return '';
    }
}
