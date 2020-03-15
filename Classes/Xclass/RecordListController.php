<?php
declare(strict_types=1);

namespace Starfishprime\Templates\Xclass;

use TYPO3\CMS\Recordlist\Controller\RecordListController as BaseRecordListController;

class RecordListController extends BaseRecordListController
{
    public function __construct()
    {
        parent::__construct();
        $this->moduleTemplate->getPageRenderer()->loadRequireJsModule('TYPO3/CMS/Templates/Clipboard');
    }
}
