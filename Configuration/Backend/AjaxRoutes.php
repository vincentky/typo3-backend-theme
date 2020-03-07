<?php

return [
    'ext-templates-upload-icon' => [
        'path' => '/icon/upload',
        'target' => \Starfishprime\Templates\Controller\BackendController::class . '::uploadIconAction'
    ],
    'ext-templates-features' => [
        'path' => '/features',
        'target' => \Starfishprime\Templates\Controller\BackendController::class . '::featuresAction'
    ],
    // Get page tree configuration
    'page_tree_configuration' => [
        'path' => '/page/tree/fetchConfiguration',
        'target' => \Starfishprime\Templates\Controller\Page\TreeController::class . '::fetchConfigurationAction'
    ],
];
