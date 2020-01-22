<?php
declare(strict_types = 1);

namespace Starfishprime\Templates\Backend\ToolbarItems;

use TYPO3\CMS\Backend\Backend\ToolbarItems\UserToolbarItem as CoreUserToolbarItem;

class UserToolbarItem extends CoreUserToolbarItem
{
    /**
     * Position relative to others
     *
     * @return int
     */
    public function getIndex()
    {
        return 100;
    }
}
