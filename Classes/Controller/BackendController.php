<?php
declare(strict_types = 1);

namespace Starfishprime\Templates\Controller;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Starfishprime\Templates\Configuration\ConfigurationManagerInterface;
use Starfishprime\Templates\Configuration\FeatureManager;
use TYPO3\CMS\Backend\View\BackendTemplateView;
use TYPO3\CMS\Core\Http\HtmlResponse;
use TYPO3\CMS\Core\Imaging\IconFactory;
use TYPO3\CMS\Core\Imaging\IconRegistry;
use TYPO3\CMS\Core\Resource\DuplicationBehavior;
use TYPO3\CMS\Core\Resource\Exception\InsufficientFolderAccessPermissionsException;
use TYPO3\CMS\Core\Resource\File;
use TYPO3\CMS\Core\Utility\File\ExtendedFileUtility;
use TYPO3\CMS\Extbase\Mvc\Controller\ActionController;
use TYPO3\CMS\Extbase\Mvc\View\JsonView;
use TYPO3\CMS\Extbase\Mvc\View\ViewInterface;

class BackendController extends ActionController
{
    protected IconRegistry $iconRegistry;

    protected IconFactory $iconFactory;

    protected FeatureManager $featureManager;

    protected ExtendedFileUtility $fileProcessor;

    /**
     * List of allowed icon file extensions with their Provider class
     *
     * @var string[]
     */
    protected const BACKEND_ICON_ALLOWED_EXTENSIONS = [
        'png', 'svg'
    ];

    /**
     * @param \TYPO3\CMS\Extbase\Configuration\ConfigurationManagerInterface $configurationManager
     */
    public function injectConfigurationManager(\TYPO3\CMS\Extbase\Configuration\ConfigurationManagerInterface $configurationManager)
    {
        $this->configurationManager = $configurationManager;
        $this->settings = $configurationManager->getConfiguration(ConfigurationManagerInterface::CONFIGURATION_TYPE_FILE_SETTINGS, 'Templates');
    }

    /**
     * Backend Template Container
     *
     * @var string
     */
    protected $defaultViewObjectName = BackendTemplateView::class;

    public function __construct(
        IconRegistry $iconRegistry,
        IconFactory $iconFactory,
        ExtendedFileUtility $fileProcessor,
        FeatureManager $featureManager
    ) {
        $this->iconRegistry = $iconRegistry;
        $this->iconFactory = $iconFactory;
        $this->featureManager = $featureManager;
        $this->fileProcessor = $fileProcessor;
    }

    /**
     * Method is called before each action and sets up the doc header.
     *
     * @param ViewInterface $view
     */
    protected function initializeView(ViewInterface $view)
    {
        parent::initializeView($view);

        if (!($this->view instanceof BackendTemplateView)) {
            return;
        }

        $this->view->getModuleTemplate()->setFlashMessageQueue($this->controllerContext->getFlashMessageQueue());
        $this->view->assign('actions', ['index', 'icons']);
        $this->view->assign('currentAction', $this->request->getControllerActionName());
    }

    /**
     * Initialize the save action.
     * This action uses the Fluid JsonView::class as view.
     *
     * @internal
     */
    public function initializeUploadIconAction()
    {
        $this->defaultViewObjectName = JsonView::class;
    }

    public function initializeFeaturesAction()
    {
        $this->defaultViewObjectName = JsonView::class;
    }

    public function indexAction(): void
    {
    }

    public function featuresAction()
    {
        $presetFeatures = $this->featureManager->getFeatures();
        $formProtection = FormProtectionFactory::get(InstallToolFormProtection::class);
        $view->assignMultiple([
            'presetsActivateToken' => $formProtection->generateToken('installTool', 'presetsActivate'),
            // This action is called again from within the card itself if a custom image path is supplied
            'presetsGetContentToken' => $formProtection->generateToken('installTool', 'presetsGetContent'),
            'presetFeatures' => $presetFeatures,
        ]);
        return new JsonResponse([
            'success' => true,
            'html' => $view->render(),
            'buttons' => [
                [
                    'btnClass' => 'btn-default t3js-presets-activate',
                    'text' => 'Activate preset',
                ],
            ],
        ]);
    }

    public function iconsAction(): void
    {
        $allIcons = $this->iconRegistry->getAllRegisteredIconIdentifiers();

        $this->view->assignMultiple([
            'allIcons' => $allIcons
        ]);
    }

    /**
     * Initialize
     *
     * @param ServerRequestInterface $request
     * @return ResponseInterface
     * @throws InsufficientFolderAccessPermissionsException
     * @throws \TYPO3\CMS\Extbase\Mvc\Exception\StopActionException
     * @throws \TYPO3\CMS\Core\Resource\Exception
     */
    public function uploadIconAction(ServerRequestInterface $request): ResponseInterface
    {
        $parsedBody = $request->getParsedBody();
        $uploadedFiles = $request->getUploadedFiles();

        if (isset($parsedBody['identifier']) && (boolean)count($uploadedFiles) && (boolean)count($uploadedFiles['icon'])) {
            $namespace = key($_FILES);
            $targetDirectory = $this->settings['Icons']['path'] ?? '1:/_temp_/';
            $fileExt = pathinfo($uploadedFiles['icon'][0]->getClientFilename(), PATHINFO_EXTENSION);
            if (!in_array($fileExt, self::BACKEND_ICON_ALLOWED_EXTENSIONS)) {
                return (new HtmlResponse(null))->withStatus(400, 'File extension not valid. Please use svg or png');
            }
            $data['upload'][0] = [
                'data' => 1,
                'target' => $targetDirectory,
            ];

            $keys = array_keys($_FILES[$namespace]);
            foreach ($keys as $key) {
                $_FILES['upload_1'][$key] = $_FILES[$namespace][$key];
            }
            $_FILES['upload_1']['name'][0] = sprintf('%s.%s', $parsedBody['identifier'], pathinfo($_FILES[$namespace]['name'][0], PATHINFO_EXTENSION));
            $this->fileProcessor->setActionPermissions();
            $this->fileProcessor->setExistingFilesConflictMode(DuplicationBehavior::REPLACE);

            $this->fileProcessor->start($data);
            $result = $this->fileProcessor->processData();
            if (isset($result['upload'][0][0])) {
                $file = $result['upload'][0][0];
                if ($file instanceof File) {
                    $this->iconRegistry->registerIcon(
                        $parsedBody['identifier'],
                        $this->iconRegistry->detectIconProvider($fileExt),
                        [
                            'source' => $file->getPublicUrl()
                        ]
                    );
                    $this->settings['Icons']['list'][$parsedBody['identifier']] = $file->getPublicUrl();
                    $this->configurationManager->writeConfiguration('Icons', $this->settings['Icons']);
                    return new HtmlResponse($this->iconFactory->getIcon($parsedBody['identifier'])->render());
                }
            }
        }
        return (new HtmlResponse(null))->withStatus(400, 'Error on upload');
    }

    /**
     * Registers an uploaded file for TYPO3 native upload handling.
     *
     * @param array &$data
     * @param string $namespace
     * @param string $fieldName
     * @param string $targetDirectory
     */
    protected function registerUploadField(array &$data, $namespace, $targetDirectory = '1:/_temp_/')
    {
        if (!isset($data['upload'])) {
            $data['upload'] = [];
        }
    }
}
