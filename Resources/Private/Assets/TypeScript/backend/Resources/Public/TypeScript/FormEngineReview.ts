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
import FormEngine = require('TYPO3/CMS/Backend/FormEngine');

/**
 * Module: TYPO3/CMS/Backend/FormEngineReview
 * Enables interaction with record fields that need review
 * @exports TYPO3/CMS/Backend/FormEngineReview
 */
class FormEngineReview {

  /**
   * Class for the toggle button
   */
  private toggleButtonClass: string;

  /**
   * Class for field list items
   */
  private fieldListItemClass: string;

  /**
   * Class of FormEngine labels
   */
  private labelSelector: string;

  /**
   * Fetches all fields that have a failed validation
   *
   * @return {$}
   */
  public static findInvalidField(): any {
    return $(document).find('.tab-content .' + FormEngine.Validation.errorClass);
  }

  /**
   * Renders an invisible button to toggle the review panel into the least possible toolbar
   *
   * @param {Object} context
   */
  public static attachButtonToModuleHeader(context: any): void {
    const $leastButtonBar: any = $('.t3js-module-docheader-bar-buttons').children().last().find('[role="toolbar"]');
    const $button: any = $('<a />', {
      class: 'btn btn-danger btn-sm hidden ' + context.toggleButtonClass,
      href: '#',
      title: TYPO3.lang['buttons.reviewFailedValidationFields'],
    }).append(
      $('<span />', {class: 'fa fa-fw fa-info'}),
    );

    $button.popover({
      container: 'body',
      html: true,
      placement: 'bottom',
    });

    $leastButtonBar.prepend($button);
  }

  /**
   * The constructor, set the class properties default values
   */
  constructor() {
    this.toggleButtonClass = 't3js-toggle-review-panel';
    this.fieldListItemClass = 't3js-field-item';
    this.labelSelector = '.t3js-formengine-label';

    this.initialize();
  }

  /**
   * Initialize the events
   */
  public initialize(): void {
    const me: any = this;
    const $document: any = $(document);

    $((): void => {
      FormEngineReview.attachButtonToModuleHeader(me);
    });
    $document.on('click', '.' + this.fieldListItemClass, this.switchToField);
    $document.on('t3-formengine-postfieldvalidation', this.checkForReviewableField);
  }

  /**
   * Checks if fields have failed validation. In such case, the markup is rendered and the toggle button is unlocked.
   */
  public checkForReviewableField = (): void => {
    const me: any = this;
    const $invalidFields: any = FormEngineReview.findInvalidField();
    const $toggleButton: any = $('.' + this.toggleButtonClass);

    if ($invalidFields.length > 0) {
      const $list: any = $('<div />', {class: 'list-group'});

      $invalidFields.each(function(this: Element): void {
        const $field: any = $(this);
        const $input: any = $field.find('[data-formengine-validation-rules]');
        let inputId: any = $input.attr('id');

        if (typeof inputId === 'undefined') {
          inputId = $input.parent().children('[id]').first().attr('id');
        }

        $list.append(
          $('<a />', {
            'class': 'list-group-item ' + me.fieldListItemClass,
            'data-field-id': inputId,
            'href': '#',
          }).text($field.find(me.labelSelector).text()),
        );
      });

      $toggleButton.removeClass('hidden');

      // bootstrap has no official API to update the content of a popover w/o destroying it
      const $popover: any = $toggleButton.data('bs.popover');
      if ($popover) {
        $popover.options.content = $list.wrapAll('<div>').parent().html();
        $popover.setContent();
        $popover.$tip.addClass($popover.options.placement);
      }
    } else {
      $toggleButton.addClass('hidden').popover('hide');
    }
  }

  /**
   * Finds the field in the form and focuses it
   *
   * @param {Event} e
   */
  public switchToField = (e: Event): void => {
    e.preventDefault();

    const $listItem: any = $(e.currentTarget);
    const referenceFieldId: string = $listItem.data('fieldId');
    const $referenceField: any = $('#' + referenceFieldId);

    // iterate possibly nested tab panels
    $referenceField.parents('[id][role="tabpanel"]').each(function(this: Element): void {
      $('[aria-controls="' + $(this).attr('id') + '"]').tab('show');
    });

    $referenceField.focus();
  }
}

// create an instance and return it
export = new FormEngineReview();
