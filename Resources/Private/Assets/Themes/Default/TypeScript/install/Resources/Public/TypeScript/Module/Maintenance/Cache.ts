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

import Notification = require('TYPO3/CMS/Backend/Notification');
import AjaxRequest = require('TYPO3/CMS/Core/Ajax/AjaxRequest');
import Router = require('../../Router');
import {AjaxResponse} from 'TYPO3/CMS/Core/Ajax/AjaxResponse';
import {AbstractInlineModule} from '../AbstractInlineModule';

/**
 * Module: TYPO3/CMS/Install/Module/Cache
 */
class Cache extends AbstractInlineModule {
  public initialize($trigger: JQuery): void {
    this.setButtonState($trigger, false);

    (new AjaxRequest(Router.getUrl('cacheClearAll', 'maintenance')))
      .get({cache: 'no-cache'})
      .then(
        async (response: AjaxResponse): Promise<any> => {
          const data = await response.resolve();
          if (data.success === true && Array.isArray(data.status)) {
            if (data.status.length > 0) {
              data.status.forEach((element: any): void => {
                Notification.success(element.title, element.message);
              });
            }
          } else {
            Notification.error('Something went wrong clearing caches');
          }
        },
        (): void => {
          // In case the clear cache action fails (typically 500 from server), do not kill the entire
          // install tool, instead show a notification that something went wrong.
          Notification.error(
            'Clearing caches failed',
            'Clearing caches went wrong on the server side. Check the system for broken extensions or missing database tables and try again.',
          );
        },
      )
      .finally((): void => {
        this.setButtonState($trigger, true);
      });
  }
}

export = new Cache();
