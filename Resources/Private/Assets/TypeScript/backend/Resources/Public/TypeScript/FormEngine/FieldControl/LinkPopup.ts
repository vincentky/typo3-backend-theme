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
import Modal = require('../../Modal');

/**
 * This module is used for the field control "Link popup"
 */
class LinkPopup {
  private controlElement: HTMLElement = null;

  constructor(controlElementId: string) {
    $((): void => {
      this.controlElement = <HTMLElement>document.querySelector(controlElementId);
      this.controlElement.addEventListener('click', this.handleControlClick);
    });
  }

  /**
   * @param {Event} e
   */
  private handleControlClick = (e: Event): void => {
    e.preventDefault();

    const itemName = this.controlElement.dataset.itemName;
    const url = this.controlElement.getAttribute('href')
      + '&P[currentValue]=' + encodeURIComponent(document.editform[itemName].value)
      + '&P[currentSelectedValues]=' + encodeURIComponent(FormEngine.getFieldElement(itemName).val());

    Modal.advanced({
      type: Modal.types.iframe,
      content: url,
      size: Modal.sizes.large,
    });
  }
}

export = LinkPopup;
