<?php

$EM_CONF[$_EXTKEY] = [
    'title' => 'Templates',
    'description' => 'Wip of new template gesture for typo3. Backend and frontend.',
    'category' => 'be',
    'state' => 'alpha',
    'clearCacheOnLoad' => 1,
    'author' => 'Vincent Kolly',
    'author_email' => 'vincentk0125@gmail.com',
    'author_company' => '',
    'version' => '0.0.1',
    'constraints' => [
        'depends' => [
            'typo3' => '10.3.*@dev',
        ],
        'conflicts' => [],
        'suggests' => [],
    ],
];
