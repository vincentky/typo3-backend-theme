<?php
declare(strict_types = 1);

namespace Starfishprime\Templates\Configuration;

use TYPO3\CMS\Core\SingletonInterface;

class FeatureManager implements SingletonInterface
{

    /**
     * Get initialized list of features with possible presets
     *
     * @param array $postValues List of $POST values
     * @return FeatureInterface[]
     * @throws Exception
     */
    public function getFeatures()
    {
        //  $GLOBALS['TYPO3_CONF_VARS']['SYS']['features'];
        //   \TYPO3\CMS\Core\Configuration\Features
        /*$features = [];
        foreach ($this->featureRegistry as $featureClass) {
            $featureInstance = GeneralUtility::makeInstance($featureClass);
            if (!($featureInstance instanceof FeatureInterface)) {
                throw new Exception(
                    'Feature ' . $featureClass . ' does not implement FeatureInterface',
                    1378644593
                );
            }
            $featureInstance->initializePresets($postValues);
            $features[] = $featureInstance;
        }
        return $features;*/
    }
}
