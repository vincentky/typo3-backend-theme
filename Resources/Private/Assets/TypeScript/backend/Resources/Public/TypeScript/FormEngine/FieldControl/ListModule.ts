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
import FormEngine = require('TYPO3/CMS/Backend/FormEngine');

/**
 * This module is used for the field control "List module" used for "group" fields
 */
class ListModule {
  private controlElement: HTMLElement = null;

  constructor(controlElementId: string) {
    $((): void => {
      this.controlElement = <HTMLElement>document.querySelector(controlElementId);
      this.controlElement.addEventListener('click', this.registerClickHandler);
    });
  }

  /**
   * @param {Event} e
   */
  private registerClickHandler = (e: Event): void => {
    e.preventDefault();

    FormEngine.preventFollowLinkIfNotSaved(this.controlElement.getAttribute('href'));
  }
}

export = ListModule;
