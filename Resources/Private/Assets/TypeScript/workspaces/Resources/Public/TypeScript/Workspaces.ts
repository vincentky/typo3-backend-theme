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

import {SeverityEnum} from 'TYPO3/CMS/Backend/Enum/Severity';
import * as $ from 'jquery';
import Modal = require('TYPO3/CMS/Backend/Modal');

export default class Workspaces {
  private tid: number = 0;

  /**
   * Renders the send to stage window
   * @param {Object} response
   * @return {$}
   */
  protected renderSendToStageWindow(response: Array<any>): JQuery {
    const result = response[0].result;
    const $form = $('<form />');

    if (typeof result.sendMailTo !== 'undefined' && result.sendMailTo.length > 0) {
      $form.append(
        $('<label />', {class: 'control-label'}).text(TYPO3.lang['window.sendToNextStageWindow.itemsWillBeSentTo']),
      );
      $form.append(
        $('<div />', {class: 'form-group'}).append(
          $('<a href="#" class="btn btn-default btn-xs t3js-workspace-recipients-selectall" />')
            .text(TYPO3.lang['window.sendToNextStageWindow.selectAll']),
          '&nbsp;',
          $('<a href="#" class="btn btn-default btn-xs t3js-workspace-recipients-deselectall" />')
            .text(TYPO3.lang['window.sendToNextStageWindow.deselectAll']),
        ),
      );

      for (const recipient of result.sendMailTo) {
        $form.append(
          $('<div />', {class: 'checkbox'}).append(
            $('<label />').text(recipient.label).prepend(
              $('<input />', {
                type: 'checkbox',
                name: 'recipients',
                class: 't3js-workspace-recipient',
                id: recipient.name,
                value: recipient.value,
              }).prop('checked', recipient.checked).prop('disabled', recipient.disabled),
            ),
          ),
        );
      }
    }

    if (typeof result.additional !== 'undefined') {
      $form.append(
        $('<div />', {class: 'form-group'}).append(
          $('<label />', {
            class: 'control-label',
            'for': 'additional',
          }).text(TYPO3.lang['window.sendToNextStageWindow.additionalRecipients']),
          $('<textarea />', {
            class: 'form-control',
            name: 'additional',
            id: 'additional',
          }).text(result.additional.value),
          $('<span />', {class: 'help-block'}).text(TYPO3.lang['window.sendToNextStageWindow.additionalRecipients.hint']),
        ),
      );
    }

    $form.append(
      $('<div />', {class: 'form-group'}).append(
        $('<label />', {
          class: 'control-label',
          'for': 'comments',
        }).text(TYPO3.lang['window.sendToNextStageWindow.comments']),
        $('<textarea />', {
          class: 'form-control',
          name: 'comments',
          id: 'comments',
        }).text(result.comments.value),
      ),
    );

    const $modal = Modal.show(
      TYPO3.lang.actionSendToStage,
      $form,
      SeverityEnum.info,
      [
        {
          text: TYPO3.lang.cancel,
          active: true,
          btnClass: 'btn-default',
          name: 'cancel',
          trigger: (): void => {
            $modal.modal('hide');
          },
        },
        {
          text: TYPO3.lang.ok,
          btnClass: 'btn-info',
          name: 'ok',
        },
      ],
    );

    return $modal;
  }

  /**
   * Checks the integrity of a record
   *
   * @param {Array} payload
   * @return {$}
   */
  protected checkIntegrity(payload: object): JQueryXHR {
    return this.sendRemoteRequest(
      this.generateRemotePayload('checkIntegrity', payload),
    );
  }

  /**
   * Sends an AJAX request
   *
   * @param {Object} payload
   * @return {$}
   */
  protected sendRemoteRequest(payload: object): JQueryXHR {
    return $.ajax({
      url: TYPO3.settings.ajaxUrls.workspace_dispatch,
      method: 'POST',
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      data: JSON.stringify(payload),
    });
  }

  /**
   * Generates the payload for a remote call
   *
   * @param {String} method
   * @param {Object} data
   * @return {{action, data, method, type}}
   */
  protected generateRemotePayload(method: string, data: object = {}): object {
    return this.generateRemotePayloadBody('RemoteServer', method, data);
  }

  /**
   * Generates the payload for MassActions
   *
   * @param {String} method
   * @param {Object} data
   * @return {{action, data, method, type}}
   */
  protected generateRemoteMassActionsPayload(method: string, data: object = {}): object {
    return this.generateRemotePayloadBody('MassActions', method, data);
  }

  /**
   * Generates the payload for Actions
   *
   * @param {String} method
   * @param {Object} data
   * @return {{action, data, method, type}}
   */
  protected generateRemoteActionsPayload(method: string, data: object = {}): object {
    return this.generateRemotePayloadBody('Actions', method, data);
  }

  /**
   * Generates the payload body
   *
   * @param {String} action
   * @param {String} method
   * @param {Object} data
   * @return {{action: String, data: Object, method: String, type: string}}
   */
  private generateRemotePayloadBody(action: string, method: string, data: object): object {
    if (data instanceof Array) {
      data.push(TYPO3.settings.Workspaces.token);
    } else {
      data = [
        data,
        TYPO3.settings.Workspaces.token,
      ];
    }
    return {
      action: action,
      data: data,
      method: method,
      type: 'rpc',
      tid: this.tid++,
    };
  }
}
