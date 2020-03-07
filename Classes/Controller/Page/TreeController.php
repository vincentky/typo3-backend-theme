<?php
declare(strict_types=1);

namespace Starfishprime\Templates\Controller\Page;

use Psr\Http\Message\ResponseInterface;
use TYPO3\CMS\Backend\Controller\Page\TreeController as BaseTreeController;
use TYPO3\CMS\Core\Http\JsonResponse;
use TYPO3\CMS\Core\Type\Bitmask\JsConfirmation;

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
            'nodeHeight' => 30,
            'marginTop' => 200,
            'indentWidth' => 20,
            'width'=> 300,
            'showIcons'=> true,
            'showCheckboxes'=> true,
        ];

        return new JsonResponse($configuration);
    }

}
