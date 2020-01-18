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

];
