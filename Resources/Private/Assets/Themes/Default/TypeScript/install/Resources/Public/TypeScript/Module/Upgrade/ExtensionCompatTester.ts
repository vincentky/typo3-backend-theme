/*
 * This file is part of the TYPO3 CMS project.
 *
 * It is free software; you can redistribute it and/or modify it under
 * the terms of the GNU General Public License, either version 2
 * of the License, or any later version.
 *
 * For the full copyright and license information, please read the
 * LICENSE.txt file that was distributed with this source code.
 *
 * The TYPO3 project - inspiring people to share!
 */

import 'bootstrap';
import * as $ from 'jquery';
import {AbstractInteractableModule} from '../AbstractInteractableModule';
import Modal = require('TYPO3/CMS/Backend/Modal');
import Notification = require('TYPO3/CMS/Backend/Notification');
import InfoBox = require('../../Renderable/InfoBox');
import ProgressBar = require('../../Renderable/ProgressBar');
import Severity = require('../../Renderable/Severity');
import Router = require('../../Router');

interface BrokenExtension {
  name: string;
  isProtected: boolean;
}

/**
 * Module: TYPO3/CMS/Install/Module/ExtensionCompatTester
 */
class ExtensionCompatTester extends AbstractInteractableModule {
  private selectorCheckTrigger: string = '.t3js-extensionCompatTester-check';
  private selectorUninstallTrigger: string = '.t3js-extensionCompatTester-uninstall';
  private selectorOutputContainer: string = '.t3js-extensionCompatTester-output';

  public initialize(currentModal: JQuery): void {
    this.currentModal = currentModal;
    this.getLoadedExtensionList();

    currentModal.on('click', this.selectorCheckTrigger, (): void => {
      this.findInModal(this.selectorUninstallTrigger).addClass('hidden');
      this.findInModal(this.selectorOutputContainer).empty();
      this.getLoadedExtensionList();
    });
    currentModal.on('click', this.selectorUninstallTrigger, (e: JQueryEventObject): void => {
      this.uninstallExtension($(e.target).data('extension'));
    });
  }

  private getLoadedExtensionList(): void {
    this.findInModal(this.selectorCheckTrigger).addClass('disabled').prop('disabled', true);
    this.findInModal('.modal-loading').hide();
    const modalContent = this.getModalBody();
    const $outputContainer = this.findInModal(this.selectorOutputContainer);
    const message = ProgressBar.render(Severity.loading, 'Loading...', '');
    $outputContainer.append(message);

    $.ajax({
      url: Router.getUrl('extensionCompatTesterLoadedExtensionList'),
      cache: false,
      success: (data: any): void => {
        modalContent.empty().append(data.html);
        Modal.setButtons(data.buttons);
        const $innerOutputContainer: JQuery = this.findInModal(this.selectorOutputContainer);
        const progressBar = ProgressBar.render(Severity.loading, 'Loading...', '');
        $innerOutputContainer.append(progressBar);

        if (data.success === true) {
          this.loadExtLocalconf().done((): void => {
            $innerOutputContainer.append(
              InfoBox.render(Severity.ok, 'ext_localconf.php of all loaded extensions successfully loaded', ''),
            );
            this.loadExtTables().done((): void => {
              $innerOutputContainer.append(
                InfoBox.render(Severity.ok, 'ext_tables.php of all loaded extensions successfully loaded', ''),
              );
            }).fail((xhr: JQueryXHR): void => {
              this.renderFailureMessages('ext_tables.php', xhr.responseJSON.brokenExtensions, $innerOutputContainer);
            }).always((): void => {
              this.unlockModal();
            })
          }).fail((xhr: JQueryXHR): void => {
            this.renderFailureMessages('ext_localconf.php', xhr.responseJSON.brokenExtensions, $innerOutputContainer);
            $innerOutputContainer.append(
              InfoBox.render(Severity.notice, 'Skipped scanning ext_tables.php files due to previous errors', ''),
            );
            this.unlockModal();
          })
        } else {
          Notification.error('Something went wrong');
        }
      },
      error: (xhr: XMLHttpRequest): void => {
        Router.handleAjaxError(xhr, modalContent);
      },
    });
  }

  private unlockModal(): void {
    this.findInModal(this.selectorOutputContainer).find('.alert-loading').remove();
    this.findInModal(this.selectorCheckTrigger).removeClass('disabled').prop('disabled', false);
  }

  private renderFailureMessages(scope: string, brokenExtensions: Array<BrokenExtension>, $outputContainer: JQuery): void {
    for (let extension of brokenExtensions) {
      let uninstallAction;
      if (!extension.isProtected) {
        uninstallAction = $('<button />', {'class': 'btn btn-danger t3js-extensionCompatTester-uninstall'})
          .attr('data-extension', extension.name)
          .text('Uninstall extension "' + extension.name + '"');
      }
      $outputContainer.append(
        InfoBox.render(
          Severity.error,
          'Loading ' + scope + ' of extension "' + extension.name + '" failed',
          (extension.isProtected ? 'Extension is mandatory and cannot be uninstalled.' : ''),
        ),
        uninstallAction,
      );
    }

    this.unlockModal();
  }

  private loadExtLocalconf(): JQueryPromise<JQueryXHR> {
    const executeToken = this.getModuleContent().data('extension-compat-tester-load-ext_localconf-token');
    return $.ajax({
      url: Router.getUrl(),
      method: 'POST',
      cache: false,
      data: {
        'install': {
          'action': 'extensionCompatTesterLoadExtLocalconf',
          'token': executeToken,
        },
      },
    });
  }

  private loadExtTables(): JQueryPromise<JQueryXHR> {
    const executeToken = this.getModuleContent().data('extension-compat-tester-load-ext_tables-token');
    return $.ajax({
      url: Router.getUrl(),
      method: 'POST',
      cache: false,
      data: {
        'install': {
          'action': 'extensionCompatTesterLoadExtTables',
          'token': executeToken,
        },
      },
    });
  }

  /**
   * Send an ajax request to uninstall an extension (or multiple extensions)
   *
   * @param extension string of extension(s) - may be comma separated
   */
  private uninstallExtension(extension: string): void {
    const executeToken = this.getModuleContent().data('extension-compat-tester-uninstall-extension-token');
    const modalContent = this.getModalBody();
    const $outputContainer = $(this.selectorOutputContainer);
    const message = ProgressBar.render(Severity.loading, 'Loading...', '');
    $outputContainer.append(message);
    $.ajax({
      url: Router.getUrl(),
      cache: false,
      method: 'POST',
      data: {
        'install': {
          'action': 'extensionCompatTesterUninstallExtension',
          'token': executeToken,
          'extension': extension,
        },
      },
      success: (data: any): void => {
        if (data.success) {
          if (Array.isArray(data.status)) {
            data.status.forEach((element: any): void => {
              const aMessage = InfoBox.render(element.severity, element.title, element.message);
              modalContent.find(this.selectorOutputContainer).empty().append(aMessage);
            });
          }
          this.findInModal(this.selectorUninstallTrigger).addClass('hidden');
          this.getLoadedExtensionList();
        } else {
          Notification.error('Something went wrong');
        }
      },
      error: (xhr: XMLHttpRequest): void => {
        Router.handleAjaxError(xhr, modalContent);
      },
    });
  }
}

export = new ExtensionCompatTester();
