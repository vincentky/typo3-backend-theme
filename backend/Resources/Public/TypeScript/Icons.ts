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
import ClientStorage = require('./Storage/Client');

enum Sizes {
  small = 'small',
  default = 'default',
  large = 'large',
  overlay = 'overlay',
}

enum States {
  default = 'default',
  disabled = 'disabled',
}

enum MarkupIdentifiers {
  default = 'default',
  inline = 'inline',
}

interface PromiseCache {
  [key: string]: JQueryPromise<any>;
}

/**
 * Module: TYPO3/CMS/Backend/Icons
 * Uses the icon API of the core to fetch icons via AJAX.
 */
class Icons {
  public readonly sizes: any = Sizes;
  public readonly states: any = States;
  public readonly markupIdentifiers: any = MarkupIdentifiers;
  private readonly promiseCache: PromiseCache = {};

  /**
   * Get the icon by its identifier
   *
   * @param {string} identifier
   * @param {Sizes} size
   * @param {string} overlayIdentifier
   * @param {string} state
   * @param {MarkupIdentifiers} markupIdentifier
   * @returns {JQueryPromise<any>}
   */
  public getIcon(
    identifier: string,
    size: Sizes,
    overlayIdentifier?: string,
    state?: string,
    markupIdentifier?: MarkupIdentifiers,
  ): JQueryPromise<any> {

    /**
     * Icon keys:
     *
     * 0: identifier
     * 1: size
     * 2: overlayIdentifier
     * 3: state
     * 4: markupIdentifier
     */
    size = size || Sizes.default;
    state = state || States.default;
    markupIdentifier = markupIdentifier || MarkupIdentifiers.default;

    const describedIcon = [identifier, size, overlayIdentifier, state, markupIdentifier];
    const cacheIdentifier = describedIcon.join('_');

    return $.when(this.getIconRegistryCache()).pipe((registryCacheIdentifier: string): any => {
      if (!ClientStorage.isset('icon_registry_cache_identifier')
        || ClientStorage.get('icon_registry_cache_identifier') !== registryCacheIdentifier
      ) {
        ClientStorage.unsetByPrefix('icon_');
        ClientStorage.set('icon_registry_cache_identifier', registryCacheIdentifier);
      }

      return this.fetchFromLocal(cacheIdentifier).then(null, (): any => {
        return this.fetchFromRemote(describedIcon, cacheIdentifier);
      });
    });
  }

  private getIconRegistryCache(): JQueryPromise<any> {
    const promiseCacheIdentifier = 'icon_registry_cache_identifier';

    if (!this.isPromiseCached(promiseCacheIdentifier)) {
      this.putInPromiseCache(promiseCacheIdentifier, $.ajax({
        url: TYPO3.settings.ajaxUrls.icons_cache,
        success: (response: string): string => {
          return response;
        },
      }));
    }

    return this.getFromPromiseCache(promiseCacheIdentifier);
  }

  /**
   * Performs the AJAX request to fetch the icon
   *
   * @param {Array<string>} icon
   * @param {string} cacheIdentifier
   * @returns {JQueryPromise<any>}
   */
  private fetchFromRemote(icon: Array<string>, cacheIdentifier: string): JQueryPromise<any> {
    if (!this.isPromiseCached(cacheIdentifier)) {
      this.putInPromiseCache(cacheIdentifier, $.ajax({
        url: TYPO3.settings.ajaxUrls.icons,
        dataType: 'html',
        data: {
          icon: JSON.stringify(icon),
        },
        success: (markup: string) => {
          if (markup.includes('t3js-icon') && markup.includes('<span class="icon-markup">')) {
            ClientStorage.set('icon_' + cacheIdentifier, markup);
          }
          return markup;
        },
      }));
    }
    return this.getFromPromiseCache(cacheIdentifier);
  }

  /**
   * Gets the icon from localStorage
   * @param {string} cacheIdentifier
   * @returns {JQueryPromise<any>}
   */
  private fetchFromLocal(cacheIdentifier: string): JQueryPromise<any> {
    const deferred = $.Deferred();
    if (ClientStorage.isset('icon_' + cacheIdentifier)) {
      deferred.resolve(ClientStorage.get('icon_' + cacheIdentifier));
    } else {
      deferred.reject();
    }

    return deferred.promise();
  }

  /**
   * Check whether icon was fetched already
   *
   * @param {string} cacheIdentifier
   * @returns {boolean}
   */
  private isPromiseCached(cacheIdentifier: string): boolean {
    return typeof this.promiseCache[cacheIdentifier] !== 'undefined';
  }

  /**
   * Get icon from cache
   *
   * @param {string} cacheIdentifier
   * @returns {JQueryPromise<any>}
   */
  private getFromPromiseCache(cacheIdentifier: string): JQueryPromise<any> {
    return this.promiseCache[cacheIdentifier];
  }

  /**
   * Put icon into cache
   *
   * @param {string} cacheIdentifier
   * @param {JQueryPromise<any>} markup
   */
  private putInPromiseCache(cacheIdentifier: string, markup: JQueryPromise<any>): void {
    this.promiseCache[cacheIdentifier] = markup;
  }
}

let iconsObject: Icons;
if (!iconsObject) {
  iconsObject = new Icons();
  TYPO3.Icons = iconsObject;
}

export = iconsObject;
