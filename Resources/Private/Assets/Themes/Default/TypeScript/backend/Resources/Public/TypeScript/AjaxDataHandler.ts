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

<<<<<<< ours
=======
import {AjaxResponse} from 'TYPO3/CMS/Core/Ajax/AjaxResponse';
import AjaxRequest = require('TYPO3/CMS/Core/Ajax/AjaxRequest');
>>>>>>> theirs
import {SeverityEnum} from './Enum/Severity';
import MessageInterface from './AjaxDataHandler/MessageInterface';
import ResponseInterface from './AjaxDataHandler/ResponseInterface';
import * as $ from 'jquery';
import Icons = require('./Icons');
import Modal = require('./Modal');
import Notification = require('./Notification');
import Viewport = require('./Viewport');

enum Identifiers {
  hide = '.t3js-record-hide',
  delete = '.t3js-record-delete',
  icon = '.t3js-icon',
}

<<<<<<< ours
=======
interface AfterProcessEventDict {
  component: string;
  action: string;
  trigger?: Node;
  table: string;
  uid: number;
}

>>>>>>> theirs
/**
 * Module: TYPO3/CMS/Backend/AjaxDataHandler
 * Javascript functions to work with AJAX and interacting with Datahandler
 * through \TYPO3\CMS\Backend\Controller\SimpleDataHandlerController->processAjaxRequest (record_process route)
 */
class AjaxDataHandler {
  /**
   * Refresh the page tree
   */
  private static refreshPageTree(): void {
    if (Viewport.NavigationContainer && Viewport.NavigationContainer.PageTree) {
      Viewport.NavigationContainer.PageTree.refreshTree();
    }
  }

<<<<<<< ours
=======
  /**
   * AJAX call to record_process route (SimpleDataHandlerController->processAjaxRequest)
   * returns a jQuery Promise to work with
   *
   * @param {string | object} params
   * @returns {Promise<any>}
   */
  private static call(params: string | object): Promise<ResponseInterface> {
    return (new AjaxRequest(TYPO3.settings.ajaxUrls.record_process)).withQueryArguments(params).get().then(async (response: AjaxResponse): Promise<ResponseInterface> => {
      return await response.resolve();
    });
  }

>>>>>>> theirs
  constructor() {
    $((): void => {
      this.initialize();
    });
  }

  /**
   * Generic function to call from the outside the script and validate directly showing errors
   *
<<<<<<< ours
   * @param {Object} parameters
   * @returns {JQueryPromise<any>}
   */
  public process(parameters: Object): JQueryPromise<any> {
    return this._call(parameters).done((result: ResponseInterface): void => {
      if (result.hasErrors) {
        this.handleErrors(result);
      }
    });
  }

=======
   * @param {string | object} parameters
   * @param {AfterProcessEventDict} eventDict Dictionary used as event detail. This is private API yet.
   * @returns {Promise<any>}
   */
  public process(parameters: string | object, eventDict?: AfterProcessEventDict): Promise<any> {
    const promise = AjaxDataHandler.call(parameters);
    return promise.then((result: ResponseInterface): ResponseInterface => {
      if (result.hasErrors) {
        this.handleErrors(result);
      }

      if (eventDict) {
        const event = new CustomEvent(`datahandler:process:${eventDict.action}`,{
          detail: {...eventDict, hasErrors: result.hasErrors}
        });
        document.dispatchEvent(event);
      }

      return result;
    });
  }

  // TODO: Many extensions rely on this behavior but it's misplaced in AjaxDataHandler. Move into Recordlist.ts and deprecate in v11.
>>>>>>> theirs
  private initialize(): void {
    // HIDE/UNHIDE: click events for all action icons to hide/unhide
    $(document).on('click', Identifiers.hide, (e: JQueryEventObject): void => {
      e.preventDefault();
      const $anchorElement = $(e.currentTarget);
      const $iconElement = $anchorElement.find(Identifiers.icon);
      const $rowElement = $anchorElement.closest('tr[data-uid]');
      const params = $anchorElement.data('params');

      // add a spinner
      this._showSpinnerIcon($iconElement);

      // make the AJAX call to toggle the visibility
<<<<<<< ours
      this._call(params).done((result: ResponseInterface): void => {
=======
      this.process(params).then((result: ResponseInterface): void => {
>>>>>>> theirs
        // print messages on errors
        if (result.hasErrors) {
          this.handleErrors(result);
        } else {
          // adjust overlay icon
          this.toggleRow($rowElement);
        }
      });
    });

    // DELETE: click events for all action icons to delete
    $(document).on('click', Identifiers.delete, (evt: JQueryEventObject): void => {
      evt.preventDefault();
      const $anchorElement = $(evt.currentTarget);
      $anchorElement.tooltip('hide');
      const $modal = Modal.confirm($anchorElement.data('title'), $anchorElement.data('message'), SeverityEnum.warning, [
        {
          text: $anchorElement.data('button-close-text') || TYPO3.lang['button.cancel'] || 'Cancel',
          active: true,
          btnClass: 'btn-default',
          name: 'cancel',
        },
        {
          text: $anchorElement.data('button-ok-text') || TYPO3.lang['button.delete'] || 'Delete',
          btnClass: 'btn-warning',
          name: 'delete',
        },
      ]);
      $modal.on('button.clicked', (e: JQueryEventObject): void => {
        if (e.target.getAttribute('name') === 'cancel') {
          Modal.dismiss();
        } else if (e.target.getAttribute('name') === 'delete') {
          Modal.dismiss();
          this.deleteRecord($anchorElement);
        }
      });
    });
  }

  /**
   * Toggle row visibility after record has been changed
   *
   * @param {JQuery} $rowElement
   */
  private toggleRow($rowElement: JQuery): void {
    const $anchorElement = $rowElement.find(Identifiers.hide);
    const table = $anchorElement.closest('table[data-table]').data('table');
    const params = $anchorElement.data('params');
    let nextParams;
    let nextState;
    let iconName;

    if ($anchorElement.data('state') === 'hidden') {
      nextState = 'visible';
      nextParams = params.replace('=0', '=1');
      iconName = 'actions-edit-hide';
    } else {
      nextState = 'hidden';
      nextParams = params.replace('=1', '=0');
      iconName = 'actions-edit-unhide';
    }
    $anchorElement.data('state', nextState).data('params', nextParams);

    // Update tooltip title
    $anchorElement.tooltip('hide').one('hidden.bs.tooltip', (): void => {
      const nextTitle = $anchorElement.data('toggleTitle');
      // Bootstrap Tooltip internally uses only .attr('data-original-title')
      $anchorElement
        .data('toggleTitle', $anchorElement.attr('data-original-title'))
        .attr('data-original-title', nextTitle);
    });

    const $iconElement = $anchorElement.find(Identifiers.icon);
<<<<<<< ours
    Icons.getIcon(iconName, Icons.sizes.small).done((icon: string): void => {
=======
    Icons.getIcon(iconName, Icons.sizes.small).then((icon: string): void => {
>>>>>>> theirs
      $iconElement.replaceWith(icon);
    });

    // Set overlay for the record icon
    const $recordIcon = $rowElement.find('.col-icon ' + Identifiers.icon);
    if (nextState === 'hidden') {
<<<<<<< ours
      Icons.getIcon('miscellaneous-placeholder', Icons.sizes.small, 'overlay-hidden').done((icon: string): void => {
=======
      Icons.getIcon('miscellaneous-placeholder', Icons.sizes.small, 'overlay-hidden').then((icon: string): void => {
>>>>>>> theirs
        $recordIcon.append($(icon).find('.icon-overlay'));
      });
    } else {
      $recordIcon.find('.icon-overlay').remove();
    }

    $rowElement.fadeTo('fast', 0.4, (): void => {
      $rowElement.fadeTo('fast', 1);
    });
    if (table === 'pages') {
      AjaxDataHandler.refreshPageTree();
    }
  }

  /**
   * Delete record by given element (icon in table)
   * don't call it directly!
   *
   * @param {JQuery} $anchorElement
   */
  private deleteRecord($anchorElement: JQuery): void {
    const params = $anchorElement.data('params');
    let $iconElement = $anchorElement.find(Identifiers.icon);

    // add a spinner
    this._showSpinnerIcon($iconElement);

<<<<<<< ours
    // make the AJAX call to toggle the visibility
    this._call(params).done((result: ResponseInterface): void => {
      // revert to the old class
      Icons.getIcon('actions-edit-delete', Icons.sizes.small).done((icon: string): void => {
=======
    const $table = $anchorElement.closest('table[data-table]');
    const table = $table.data('table');
    let $rowElements = $anchorElement.closest('tr[data-uid]');
    const uid = $rowElements.data('uid');

    // make the AJAX call to toggle the visibility
    const eventData = {component: 'datahandler', trigger: $anchorElement.get(0), action: 'delete', table, uid};
    this.process(params, eventData).then((result: ResponseInterface): void => {
      // revert to the old class
      Icons.getIcon('actions-edit-delete', Icons.sizes.small).then((icon: string): void => {
>>>>>>> theirs
        $iconElement = $anchorElement.find(Identifiers.icon);
        $iconElement.replaceWith(icon);
      });
      // print messages on errors
      if (result.hasErrors) {
        this.handleErrors(result);
      } else {
<<<<<<< ours
        const $table = $anchorElement.closest('table[data-table]');
        const $panel = $anchorElement.closest('.panel');
        const $panelHeading = $panel.find('.panel-heading');
        const table = $table.data('table');
        let $rowElements = $anchorElement.closest('tr[data-uid]');
        const uid = $rowElements.data('uid');
=======
        const $panel = $anchorElement.closest('.panel');
        const $panelHeading = $panel.find('.panel-heading');
>>>>>>> theirs
        const $translatedRowElements = $table.find('[data-l10nparent=' + uid + ']').closest('tr[data-uid]');
        $rowElements = $rowElements.add($translatedRowElements);

        $rowElements.fadeTo('slow', 0.4, (): void => {
          $rowElements.slideUp('slow', (): void => {
            $rowElements.remove();
            if ($table.find('tbody tr').length === 0) {
              $panel.slideUp('slow');
            }
          });
        });
        if ($anchorElement.data('l10parent') === '0' || $anchorElement.data('l10parent') === '') {
          const count = Number($panelHeading.find('.t3js-table-total-items').html());
          $panelHeading.find('.t3js-table-total-items').text(count - 1);
        }

        if (table === 'pages') {
          AjaxDataHandler.refreshPageTree();
        }
      }
    });
  }

  /**
   * Handle the errors from result object
   *
   * @param {Object} result
   */
  private handleErrors(result: ResponseInterface): void {
    $.each(result.messages, (position: number, message: MessageInterface): void => {
      Notification.error(message.title, message.message);
    });
  }

  /**
<<<<<<< ours
   * AJAX call to record_process route (SimpleDataHandlerController->processAjaxRequest)
   * returns a jQuery Promise to work with
   *
   * @param {Object} params
   * @returns {JQueryXHR}
   */
  private _call(params: Object): JQueryXHR {
    return $.getJSON(TYPO3.settings.ajaxUrls.record_process, params);
  }

  /**
=======
>>>>>>> theirs
   * Replace the given icon with a spinner icon
   *
   * @param {Object} $iconElement
   * @private
   */
  private _showSpinnerIcon($iconElement: JQuery): void {
<<<<<<< ours
    Icons.getIcon('spinner-circle-dark', Icons.sizes.small).done((icon: string): void => {
=======
    Icons.getIcon('spinner-circle-dark', Icons.sizes.small).then((icon: string): void => {
>>>>>>> theirs
      $iconElement.replaceWith(icon);
    });
  }
}

export = new AjaxDataHandler();
