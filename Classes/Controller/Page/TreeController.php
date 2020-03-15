<?php
declare(strict_types=1);

namespace Starfishprime\Templates\Controller\Page;

use Psr\Http\Message\ResponseInterface;
use TYPO3\CMS\Backend\Controller\Page\TreeController as BaseTreeController;
use TYPO3\CMS\Core\Configuration\ExtensionConfiguration;
use TYPO3\CMS\Core\Http\JsonResponse;
use TYPO3\CMS\Core\Type\Bitmask\JsConfirmation;
use TYPO3\CMS\Core\Utility\GeneralUtility;


class TreeController extends BaseTreeController
{
    /**
     * Returns page tree configuration in JSON
     *
     * @return ResponseInterface
     */
    public function fetchConfigurationAction(): ResponseInterface
    {
        $configuration = [
            'allowRecursiveDelete' => !empty($this->getBackendUser()->uc['recursiveDelete']),
            'doktypes' => $this->getDokTypes(),
            'displayDeleteConfirmation' => $this->getBackendUser()->jsConfirmation(JsConfirmation::DELETE),
            'temporaryMountPoint' => $this->getMountPointPath((int)($this->getBackendUser()->uc['pageTree_temporaryMountPoint'] ?? 0)),
            'nodeHeight' => (int)$this->getExtensionConfiguration()->get('templates','pageTreeNodeHeight') ?? 30,
            'width' => (int)$this->getExtensionConfiguration()->get('templates','defaultPageTreeWidth') ?? 280,
            'showIcons' => true,
            'showCheckboxes' => true
        ];

        return new JsonResponse($configuration);
    }

    /**
     * @return ExtensionConfiguration
     */
    protected function getExtensionConfiguration(): ExtensionConfiguration
    {
        return GeneralUtility::makeInstance(ExtensionConfiguration::class);
    }

}
