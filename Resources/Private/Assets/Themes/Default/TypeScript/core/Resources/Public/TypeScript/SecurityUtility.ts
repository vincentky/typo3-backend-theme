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

/**
 * Module: TYPO3/CMS/Core/SecurityUtility
 * contains method to escape input to prevent XSS and other security related things
 * @exports TYPO3/CMS/Core/SecurityUtility
 */
class SecurityUtility {
  private readonly documentRef: Document;

  /**
   * @param {Document} documentRef
   */
  constructor(documentRef: Document = document) {
    this.documentRef = documentRef;
  }

  /**
   * Encodes HTML to use according entities. Behavior is similar to PHP's
   * htmlspecialchars. Input might contain XSS, output has it encoded.
   *
   * @param {string} value Input value to be encoded
   * @param {boolean} doubleEncode (default `true`)
   * @return {string}
   */
  public encodeHtml(value: string, doubleEncode: boolean = true): string {
    let anvil: HTMLSpanElement = this.createAnvil();
    if (!doubleEncode) {
      // decode HTML entities step-by-step
      // but NEVER(!) as a whole, since that would allow XSS
      value = value.replace(/&[#A-Za-z0-9]+;/g, (html: string) => {
        anvil.innerHTML = html;
        return anvil.innerText;
      });
    }
    // apply arbitrary data a text node
    // thus browser is capable of properly encoding
    anvil.innerText = value;
    return anvil.innerHTML;
  }

  /**
   * @param {string} value
   */
  public debug(value: string): void {
    if (value !== this.encodeHtml(value)) {
      console.warn('XSS?!', value);
    }
  }

  /**
   * @return {HTMLSpanElement}
   */
  private createAnvil(): HTMLSpanElement {
    return this.documentRef.createElement('span');
  }
}

export = SecurityUtility;
