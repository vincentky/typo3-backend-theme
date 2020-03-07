<?php
declare(strict_types=1);

namespace Starfishprime\Templates\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Starfishprime\Templates\Configuration\ConfigurationManagerInterface;
use TYPO3\CMS\Core\Imaging\IconRegistry;

/**
 * Override backend icons
 */
class TreeConfigurationOverride implements MiddlewareInterface
{
    protected ConfigurationManagerInterface $configurationManager;
    protected IconRegistry $iconRegistry;

    public function __construct(ConfigurationManagerInterface $configurationManager, IconRegistry $iconRegistry)
    {
        $this->configurationManager = $configurationManager;
        $this->iconRegistry = $iconRegistry;
    }

    /**
     * @param ServerRequestInterface $request
     * @param RequestHandlerInterface $handler
     * @return ResponseInterface
     */
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        //   $routeResult = $this->matcher->matchRequest($request);
        $response = $handler->handle($request);
        $b = $response->getBody()->getContents();
        $response = $response->withHeader(
            'Content-Length',
            (string)$response->getBody()->getSize()
        );


        return $response;
    }
}
