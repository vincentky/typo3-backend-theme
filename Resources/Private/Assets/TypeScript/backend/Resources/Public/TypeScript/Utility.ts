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
 * Module: TYPO3/CMS/Backend/Utility
 */
class Utility {
  /**
   * Splits a string by a given delimiter and trims the values
   *
   * @param {string} delimiter
   * @param {string} string
   * @return Array<string>
   */
  public static trimExplode(delimiter: string, string: string): Array<string> {
    return string.split(delimiter).map((item: string) => item.trim()).filter((item: string) => item !== '');
  }

  /**
   * Splits a string by a given delimiter and converts the values to integer
   *
   * @param {string} delimiter
   * @param {string} string
   * @param {boolean} excludeZeroValues
   * @return Array<number>
   */
  public static intExplode(delimiter: string, string: string, excludeZeroValues: boolean = false): Array<number> {
    return string
      .split(delimiter)
      .map((item: string) => parseInt(item, 10))
      .filter((item: number) => !isNaN(item) || excludeZeroValues && item === 0);
  }

  /**
   * Checks if a given number is really a number
   *
   * Taken from:
   * http://dl.dropbox.com/u/35146/js/tests/isNumber.html
   *
   * @param {number} value
   * @returns {boolean}
   */
  public static isNumber(value: number): boolean {
    return !isNaN(parseFloat(value.toString())) && isFinite(value);
  }

  /**
   * Gets a parameter from a given url
   *
   * @param {string} url
   * @param {string} parameter
   * @returns {string}
   */
  public static getParameterFromUrl(url: string, parameter: string): string {
    if (typeof url.split !== 'function') {
      return '';
    }
    const parts = url.split('?');
    let value = '';

    if (parts.length >= 2) {
      const queryString = parts.join('?');

      const prefix = encodeURIComponent(parameter) + '=';
      const parameters = queryString.split(/[&;]/g);
      for (let i = parameters.length; i-- > 0; ) {
        if (parameters[i].lastIndexOf(prefix, 0) !== -1) {
          value = parameters[i].split('=')[1];
          break;
        }
      }
    }

    return value;
  }

  /**
   * Updates a parameter inside of given url
   *
   * @param {string} url
   * @param {string} key
   * @param {string} value
   * @returns {string}
   */
  public static updateQueryStringParameter(url: string, key: string, value: string): string {
    const re = new RegExp('([?&])' + key + '=.*?(&|$)', 'i');
    const separator = url.includes('?') ? '&' : '?';

    if (url.match(re)) {
      return url.replace(re, '$1' + key + '=' + value + '$2');
    }
    return url + separator + key + '=' + value;
  }

  public static convertFormToObject(form: HTMLFormElement): { [key: string]: any } {
    const obj: { [key: string]: any } = {};
    form.querySelectorAll('input, select, textarea').forEach((element: HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement): void => {
      const name = element.name;
      const value = element.value;

      if (name) {
        obj[name] = value;
      }
    });

    return obj;
  }
}

export = Utility;
