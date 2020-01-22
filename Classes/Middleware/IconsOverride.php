<?php
declare(strict_types = 1);

namespace Starfishprime\Templates\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Starfishprime\Templates\Configuration\ConfigurationManagerInterface;
use TYPO3\CMS\Core\Imaging\IconRegistry;
use TYPO3\CMS\Core\Utility\GeneralUtility;

/**
 * Override backend icons
 */
class IconsOverride implements MiddlewareInterface
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
        $settings = $this->configurationManager->getConfiguration(ConfigurationManagerInterface::CONFIGURATION_TYPE_FILE_SETTINGS, 'Templates');
        if (isset($settings['Icons']['list']) && is_array($settings['Icons']['list'])) {
            foreach ($settings['Icons']['list'] as $identifier => $path) {
                $this->iconRegistry->registerIcon(
                    $identifier,
                    $this->iconRegistry->detectIconProvider($path),
                    ['source' => GeneralUtility::getFileAbsFileName($path)]
                );
            }
        }
        return $handler->handle($request);
    }
}
