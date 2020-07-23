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

import {KeyTypesEnum} from './Enum/KeyTypes';
import * as $ from 'jquery';
import NProgress = require('nprogress');
import Modal = require('./Modal');
import Severity = require('./Severity');
import SecurityUtility = require('TYPO3/CMS/Core/SecurityUtility');
import {MessageUtility} from 'TYPO3/CMS/Backend/Utility/MessageUtility';

interface Response {
  file?: number;
  error?: string;
}

/**
 * Module: TYPO3/CMS/Backend/OnlineMedia
 * Javascript for show the online media dialog
 */
class OnlineMedia {
  private readonly securityUtility: SecurityUtility;
  constructor() {
    this.securityUtility = new SecurityUtility();
    $((): void => {
      this.registerEvents();
    });
  }

  private registerEvents(): void {
    const me = this;
    $(document).on('click', '.t3js-online-media-add-btn', (e: JQueryEventObject): void => {
      me.triggerModal($(e.currentTarget));
    });
  }

  /**
   * @param {JQuery} $trigger
   * @param {string} url
   */
  private addOnlineMedia($trigger: JQuery, url: string): void {
    const target = $trigger.data('target-folder');
    const allowed = $trigger.data('online-media-allowed');
    const irreObjectUid = $trigger.data('file-irre-object');

    NProgress.start();
    $.post(
      TYPO3.settings.ajaxUrls.online_media_create,
      {
        url: url,
        targetFolder: target,
        allowed: allowed,
      },
      (data: Response): void => {
        if (data.file) {
          const message = {
            objectGroup: irreObjectUid,
            table: 'sys_file',
            uid: data.file,
          };
          MessageUtility.send(message);
        } else {
          const $confirm = Modal.confirm(
            'ERROR',
            data.error,
            Severity.error,
            [{
              text: TYPO3.lang['button.ok'] || 'OK',
              btnClass: 'btn-' + Severity.getCssClass(Severity.error),
              name: 'ok',
              active: true,
            }],
          ).on('confirm.button.ok', (): void => {
            $confirm.modal('hide');
          });
        }
        NProgress.done();
      },
    );
  }

  /**
   * @param {JQuery} $currentTarget
   */
  private triggerModal($currentTarget: JQuery): void {
    const btnSubmit = $currentTarget.data('btn-submit') || 'Add';
    const placeholder = $currentTarget.data('placeholder') || 'Paste media url here...';
    const allowedExtMarkup = $.map($currentTarget.data('online-media-allowed').split(','), (ext: string): string => {
      return '<span class="label label-success">' + this.securityUtility.encodeHtml(ext.toUpperCase(), false) + '</span>';
    });
    const allowedHelpText = $currentTarget.data('online-media-allowed-help-text') || 'Allow to embed from sources:';

    const $markup = $('<div>')
      .attr('class', 'form-control-wrap')
      .append([
        $('<input>')
          .attr('type', 'text')
          .attr('class', 'form-control online-media-url')
          .attr('placeholder', placeholder),
        $('<div>')
          .attr('class', 'help-block')
          .html(this.securityUtility.encodeHtml(allowedHelpText, false) + '<br>' + allowedExtMarkup.join(' ')),
      ]);
    const $modal = Modal.show(
      $currentTarget.attr('title'),
      $markup,
      Severity.notice,
      [{
        text: btnSubmit,
        btnClass: 'btn btn-primary',
        name: 'ok',
        trigger: (): void => {
          const url = $modal.find('input.online-media-url').val();
          if (url) {
            $modal.modal('hide');
            this.addOnlineMedia($currentTarget, url);
          }
        },
      }],
    );

    $modal.on('shown.bs.modal', (e: JQueryEventObject): void => {
      // focus the input field
      $(e.currentTarget).find('input.online-media-url').first().focus().on('keydown', (kdEvt: JQueryEventObject): void => {
        if (kdEvt.keyCode === KeyTypesEnum.ENTER) {
          $modal.find('button[name="ok"]').trigger('click');
        }
      });
    });
  }
}

export = new OnlineMedia();
