<?php

return [
    'backend' => [
        'starfishprime/templates/icons-override' => [
            'target' => \Starfishprime\Templates\Middleware\IconsOverride::class,
            'after' => [
                'typo3/cms-backend/site-resolver',
            ],
        ],
      /*  'starfishprime/templates/tree-configuration-override' => [
            'target' => \Starfishprime\Templates\Middleware\TreeConfigurationOverride::class,
            'after' => [
                'typo3/cms-backend/site-resolver',
            ],
        ],*/
    ],
];
