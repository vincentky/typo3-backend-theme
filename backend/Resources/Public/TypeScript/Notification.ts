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

import * as $ from 'jquery';
import {SeverityEnum} from './Enum/Severity';
import Severity = require('./Severity');

/**
 * Module: TYPO3/CMS/Backend/Notification
 * Notification API for the TYPO3 backend
 */
class Notification {
  private static duration: number = 5;
  private static messageContainer: JQuery = null;

  /**
   * Show a notice notification
   *
   * @param {string} title
   * @param {string} message
   * @param {number} duration
   */
  public static notice(title: string, message?: string, duration?: number): void {
    Notification.showMessage(title, message, SeverityEnum.notice, duration);
  }

  /**
   * Show a info notification
   *
   * @param {string} title
   * @param {string} message
   * @param {number} duration
   */
  public static info(title: string, message?: string, duration?: number): void {
    Notification.showMessage(title, message, SeverityEnum.info, duration);
  }

  /**
   * Show a success notification
   *
   * @param {string} title
   * @param {string} message
   * @param {number} duration
   */
  public static success(title: string, message?: string, duration?: number): void {
    Notification.showMessage(title, message, SeverityEnum.ok, duration);
  }

  /**
   * Show a warning notification
   *
   * @param {string} title
   * @param {string} message
   * @param {number} duration
   */
  public static warning(title: string, message?: string, duration?: number): void {
    Notification.showMessage(title, message, SeverityEnum.warning, duration);
  }

  /**
   * Show a error notification
   *
   * @param {string} title
   * @param {string} message
   * @param {number} duration
   */
  public static error(title: string, message?: string, duration: number = 0): void {
    Notification.showMessage(title, message, SeverityEnum.error, duration);
  }

  /**
   * @param {string} title
   * @param {string} message
   * @param {SeverityEnum} severity
   * @param {number} duration
   */
  public static showMessage(title: string,
                            message?: string,
                            severity: SeverityEnum = SeverityEnum.info,
                            duration: number | string = this.duration): void {
    const className = Severity.getCssClass(severity);
    let icon = '';
    switch (severity) {
      case SeverityEnum.notice:
        icon = 'lightbulb-o';
        break;
      case SeverityEnum.ok:
        icon = 'check';
        break;
      case SeverityEnum.warning:
        icon = 'exclamation';
        break;
      case SeverityEnum.error:
        icon = 'times';
        break;
      case SeverityEnum.info:
      default:
        icon = 'info';
    }

    duration = (typeof duration === 'undefined')
      ? this.duration
      : (
        typeof duration === 'string'
          ? parseFloat(duration)
          : duration
      );

    if (this.messageContainer === null) {
      this.messageContainer = $('<div>', {'id': 'alert-container'}).appendTo('body');
    }
    const $box = $(
      '<div class="alert alert-' + className + ' alert-dismissible fade" role="alert">' +
        '<button type="button" class="close" data-dismiss="alert">' +
          '<span aria-hidden="true"><i class="fa fa-times-circle"></i></span>' +
          '<span class="sr-only">Close</span>' +
        '</button>' +
        '<div class="media">' +
          '<div class="media-left">' +
            '<span class="fa-stack fa-lg">' +
              '<i class="fa fa-circle fa-stack-2x"></i>' +
              '<i class="fa fa-' + icon + ' fa-stack-1x"></i>' +
            '</span>' +
          '</div>' +
          '<div class="media-body">' +
            '<h4 class="alert-title"></h4>' +
            '<p class="alert-message text-pre-wrap"></p>' +
          '</div>' +
        '</div>' +
      '</div>',
    );
    $box.find('.alert-title').text(title);
    $box.find('.alert-message').text(message);
    $box.on('close.bs.alert', (e: Event) => {
      e.preventDefault();
      const $me = $(e.currentTarget);
      $me
        .clearQueue()
        .queue((next: any): void => {
          $me.removeClass('in');
          next();
        })
        .slideUp(() => {
          $me.remove();
        });
    });
    $box.appendTo(this.messageContainer);
    $box.delay(200)
      .queue((next: any): void => {
        $box.addClass('in');
        next();
      });

    if (duration > 0) {
      // if duration > 0 dismiss alert
      $box.delay(duration * 1000)
        .queue((next: any): void => {
          $box.alert('close');
          next();
        });
    }
  }
}

let notificationObject;

try {
  // fetch from parent
  if (parent && parent.window.TYPO3 && parent.window.TYPO3.Notification) {
    notificationObject = parent.window.TYPO3.Notification;
  }

  // fetch object from outer frame
  if (top && top.TYPO3.Notification) {
    notificationObject = top.TYPO3.Notification;
  }
} catch (e) {
  // This only happens if the opener, parent or top is some other url (eg a local file)
  // which loaded the current window. Then the browser's cross domain policy jumps in
  // and raises an exception.
  // For this case we are safe and we can create our global object below.
}

if (!notificationObject) {
  notificationObject = Notification;

  // attach to global frame
  if (typeof TYPO3 !== 'undefined') {
    TYPO3.Notification = notificationObject;
  }
}
export = notificationObject;
