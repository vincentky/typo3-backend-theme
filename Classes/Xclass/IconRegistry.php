<?php
declare(strict_types = 1);

namespace Starfishprime\Templates\Xclass;

use TYPO3\CMS\Core\Imaging\IconRegistry as CoreIconRegistry;

class IconRegistry extends CoreIconRegistry
{
    public function getIconConfigurationByIdentifier($identifier)
    {
        die('0ds');
        return parent::initialize($identifier);
    }

    protected function initialize()
    {
        parent::initialize();
        if ($this->fullInitialized) {
        }
    }
}
