<?php
declare(strict_types = 1);

namespace Starfishprime\Templates\EventListener;

class IconRegistry
{
    public function __invoke($event): void
    {
        die('dsa');
        $event->getMailer()->injectMailSettings(['transport' => 'null']);
    }
}
