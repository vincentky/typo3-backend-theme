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

import 'bootstrap';
import * as $ from 'jquery';
import 'TYPO3/CMS/Backend/Input/Clearable';

/**
 * Module: TYPO3/CMS/Backend/Login
 * JavaScript module for the backend login form
 * @exports TYPO3/CMS/Backend/Login
 *
 * Class and file name do not match as the class was renamed, but to keep overrides in place, the filename has to stay!
 */
class BackendLogin {
  public options: any;

  constructor() {
    this.options = {
      error: '.t3js-login-error',
      errorNoCookies: '.t3js-login-error-nocookies',
      formFields: '.t3js-login-formfields',
      interfaceField: '.t3js-login-interface-field',
      loginForm: '#typo3-login-form',
      submitButton: '.t3js-login-submit',
      submitHandler: null,
      useridentField: '.t3js-login-userident-field',
    };

    this.checkCookieSupport();
    this.checkForInterfaceCookie();
    this.initializeEvents();

    // prevent opening the login form in the backend frameset
    if (top.location.href !== location.href) {
      top.location.href = location.href;
    }
  }

  /**
   * Hide all form fields and show a progress message and icon
   */
  public showLoginProcess = (): void => {
    this.showLoadingIndicator();
    $(this.options.error).addClass('hidden');
    $(this.options.errorNoCookies).addClass('hidden');
  }

  /**
   * Show the loading spinner in the submit button
   */
  public showLoadingIndicator = (): void => {
    $(this.options.submitButton).button('loading');
  }

  /**
   * Pass on to registered submit handler
   *
   * @param {Event} event
   */
  public handleSubmit = (event: Event): void => {
    this.showLoginProcess();

    if (typeof this.options.submitHandler === 'function') {
      this.options.submitHandler(event);
    }
  }

  /**
   * Store the new selected Interface in a cookie to save it for future visits
   */
  public interfaceSelectorChanged = (): void => {
    const now = new Date();
    // cookie expires in one year
    const expires = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 365);
    document.cookie = 'typo3-login-interface='
      + $(this.options.interfaceField).val()
      + '; expires=' + expires.toUTCString() + ';';
  }

  /**
   * Check if an interface was stored in a cookie and preselect it in the select box
   */
  public checkForInterfaceCookie = (): void => {
    if ($(this.options.interfaceField).length) {
      const posStart = document.cookie.indexOf('typo3-login-interface=');
      if (posStart !== -1) {
        let selectedInterface = document.cookie.substr(posStart + 22);
        selectedInterface = selectedInterface.substr(0, selectedInterface.indexOf(';'));
        $(this.options.interfaceField).val(selectedInterface);
      }
    }
  }

  /**
   * Hides input fields and shows cookie warning
   */
  public showCookieWarning = (): void => {
    $(this.options.formFields).addClass('hidden');
    $(this.options.errorNoCookies).removeClass('hidden');
  }

  /**
   * Hides cookie warning and shows input fields
   */
  public hideCookieWarning = (): void => {
    $(this.options.formFields).removeClass('hidden');
    $(this.options.errorNoCookies).addClass('hidden');
  }

  /**
   * Checks browser's cookie support
   * see http://stackoverflow.com/questions/8112634/jquery-detecting-cookies-enabled
   */
  public checkCookieSupport = (): void => {
    const cookieEnabled = navigator.cookieEnabled;

    // when cookieEnabled flag is present and false then cookies are disabled.
    if (cookieEnabled === false) {
      this.showCookieWarning();
    } else {
      // try to set a test cookie if we can't see any cookies and we're using
      // either a browser that doesn't support navigator.cookieEnabled
      // or IE (which always returns true for navigator.cookieEnabled)
      if (!document.cookie && (cookieEnabled === null || /*@cc_on!@*/false)) {
        document.cookie = 'typo3-login-cookiecheck=1';

        if (!document.cookie) {
          this.showCookieWarning();
        } else {
          // unset the cookie again
          document.cookie = 'typo3-login-cookiecheck=; expires=' + new Date(0).toUTCString();
        }
      }
    }
  }

  /**
   * Registers listeners for the Login Interface
   */
  public initializeEvents = (): void => {
    $(document).ajaxStart(this.showLoadingIndicator);
    $(this.options.loginForm).on('submit', this.handleSubmit);

    // the Interface selector is not always present, so this check is needed
    if ($(this.options.interfaceField).length > 0) {
      $(document).on('change blur', this.options.interfaceField, this.interfaceSelectorChanged);
    }

    (<NodeListOf<HTMLInputElement>>document.querySelectorAll('.t3js-clearable')).forEach(
      (clearableField: HTMLInputElement) => clearableField.clearable(),
    );

    // carousel news height transition
    $('.t3js-login-news-carousel').on('slide.bs.carousel', (e: any) => {
      const nextH = $(e.relatedTarget).height();
      const $element: JQuery = $(e.target);
      $element.find('div.active').parent().animate({ height: nextH }, 500);
    });
  }
}

export = new BackendLogin();
