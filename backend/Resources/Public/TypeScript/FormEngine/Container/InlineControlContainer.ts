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

import {AjaxDispatcher} from './../InlineRelation/AjaxDispatcher';
import {InlineResponseInterface} from './../InlineRelation/InlineResponseInterface';
import {MessageUtility} from '../../Utility/MessageUtility';
import * as $ from 'jquery';
import FormEngine = require('TYPO3/CMS/Backend/FormEngine');
import FormEngineValidation = require('TYPO3/CMS/Backend/FormEngineValidation');
import Icons = require('../../Icons');
import InfoWindow = require('../../InfoWindow');
import Modal = require('../../Modal');
import Notification = require('../../Notification');
import NProgress = require('nprogress');
import Severity = require('../../Severity');
import Sortable = require('Sortable');
import Utility = require('../../Utility');

enum Selectors {
  toggleSelector = '[data-toggle="formengine-inline"]',
  controlSectionSelector = '.t3js-formengine-irre-control',
  createNewRecordButtonSelector = '.t3js-create-new-button',
  createNewRecordBySelectorSelector = '.t3js-create-new-selector',
  deleteRecordButtonSelector = '.t3js-editform-delete-inline-record',
  enableDisableRecordButtonSelector = '.t3js-toggle-visibility-button',
  infoWindowButton = '[data-action="infowindow"]',
  synchronizeLocalizeRecordButtonSelector = '.t3js-synchronizelocalize-button',
  uniqueValueSelectors = 'select.t3js-inline-unique',
  revertUniqueness = '.t3js-revert-unique',
  controlContainerButtons = '.t3js-inline-controls',
}

enum States {
  new = 'inlineIsNewRecord',
  visible = 'panel-visible',
  collapsed = 'panel-collapsed',
}

enum Separators {
  structureSeparator = '-',
}

enum SortDirections {
  DOWN = 'down',
  UP = 'up',
}

interface XhrQueue {
  [key: string]: JQueryXHR;
}

interface ProgressQueue {
  [key: string]: any;
}

interface Appearance {
  expandSingle?: boolean;
  useSortable?: boolean;
}

interface UniqueDefinition {
  elTable: string;
  field: string;
  max: number;
  possible: { [key: string]: string };
  selector: string;
  table: string;
  type: string;
  used: UniqueDefinitionCollection;
}

interface UniqueDefinitionCollection {
  [key: string]: UniqueDefinitionUsed;
}

interface UniqueDefinitionUsed {
  table: string;
  uid: string | number;
}

class InlineControlContainer {
  private container: HTMLElement = null;
  private ajaxDispatcher: AjaxDispatcher = null;
  private appearance: Appearance = null;
  private xhrQueue: XhrQueue = {};
  private progessQueue: ProgressQueue = {};
  private noTitleString: string = (TYPO3.lang ? TYPO3.lang['FormEngine.noRecordTitle'] : '[No title]');

  /**
   * Checks whether an event target matches the given selector and returns the matching element.
   * May be used in conjunction with event delegation.
   *
   * @param {EventTarget} eventTarget
   * @param {string} selector
   */
  private static getDelegatedEventTarget(eventTarget: EventTarget, selector: string): HTMLElement | null {
    let targetElement: HTMLElement;

    if ((targetElement = <HTMLElement>(<Element>eventTarget).closest(selector)) === null) {
      if ((<Element>eventTarget).matches(selector)) {
        targetElement = <HTMLElement>eventTarget;
      }
    }

    return targetElement;
  }

  /**
   * @param {string} objectId
   * @return HTMLDivElement
   */
  private static getInlineRecordContainer(objectId: string): HTMLDivElement {
    return <HTMLDivElement>document.querySelector('[data-object-id="' + objectId + '"]');
  }

  /**
   * @param {Event} e
   */
  private static registerInfoButton(e: Event): void {
    let target: HTMLElement;
    if ((target = InlineControlContainer.getDelegatedEventTarget(
      e.target,
      Selectors.infoWindowButton)
    ) === null) {
      return;
    }

    e.preventDefault();
    e.stopImmediatePropagation();

    InfoWindow.showItem(target.dataset.infoTable, target.dataset.infoUid);
  }

  /**
   * @param {string} objectId
   */
  private static toggleElement(objectId: string): void {
    const recordContainer = InlineControlContainer.getInlineRecordContainer(objectId);
    if (recordContainer.classList.contains(States.collapsed)) {
      recordContainer.classList.remove(States.collapsed);
      recordContainer.classList.add(States.visible);
    } else {
      recordContainer.classList.remove(States.visible);
      recordContainer.classList.add(States.collapsed);
    }
  }

  /**
   * @param {string} objectId
   * @return boolean
   */
  private static isNewRecord(objectId: string): boolean {
    const recordContainer = InlineControlContainer.getInlineRecordContainer(objectId);
    return recordContainer.classList.contains(States.new);
  }

  /**
   * @param {string} objectId
   * @param {boolean} value
   */
  private static updateExpandedCollapsedStateLocally(objectId: string, value: boolean): void {
    const recordContainer = InlineControlContainer.getInlineRecordContainer(objectId);

    const ucName = 'uc[inlineView]'
      + '[' + recordContainer.dataset.topmostParentTable + ']'
      + '[' + recordContainer.dataset.topmostParentUid + ']'
      + recordContainer.dataset.fieldName;
    const ucFormObj = document.getElementsByName(ucName);

    if (ucFormObj.length) {
      (<HTMLInputElement>ucFormObj[0]).value = value ? '1' : '0';
    }
  }

  /**
   * @param {UniqueDefinitionCollection} hashmap
   */
  private static getValuesFromHashMap(hashmap: UniqueDefinitionCollection): Array<any> {
    return Object.keys(hashmap).map((key: string) => hashmap[key]);
  }

  private static selectOptionValueExists(selectElement: HTMLSelectElement, value: string): boolean {
    return selectElement.querySelector('option[value="' + value + '"]') !== null;
  }

  /**
   * @param {HTMLSelectElement} selectElement
   * @param {string} value
   */
  private static removeSelectOptionByValue(selectElement: HTMLSelectElement, value: string): void {
    const option = selectElement.querySelector('option[value="' + value + '"]');
    if (option !== null) {
      option.remove();
    }
  }

  /**
   * @param {HTMLSelectElement} selectElement
   * @param {string} value
   * @param {UniqueDefinition} unique
   */
  private static reAddSelectOption(selectElement: HTMLSelectElement, value: string, unique: UniqueDefinition): void {
    if (InlineControlContainer.selectOptionValueExists(selectElement, value)) {
      return;
    }

    const options: NodeListOf<HTMLOptionElement> = selectElement.querySelectorAll('option');
    let index: number = -1;

    for (let possibleValue of Object.keys(unique.possible)) {
      if (possibleValue === value) {
        break;
      }

      for (let k = 0; k < options.length; ++k) {
        const option = options[k];
        if (option.value === possibleValue) {
          index = k;
          break;
        }
      }
    }

    if (index === -1) {
      index = 0;
    } else if (index < options.length) {
      index++;
    }
    // recreate the <option> tag
    const readdOption = document.createElement('option');
    readdOption.text = unique.possible[value];
    readdOption.value = value;
    // add the <option> at the right position
    selectElement.insertBefore(readdOption, selectElement.options[index]);
  }

  /**
   * @param {string} elementId
   */
  constructor(elementId: string) {
    $((): void => {
      this.container = <HTMLElement>document.querySelector('#' + elementId);
      this.ajaxDispatcher = new AjaxDispatcher(this.container.dataset.objectGroup);

      this.registerEvents();
    });
  }

  private registerEvents(): void {
    this.container.addEventListener('click', (e: Event): void => {
      this.registerToggle(e);
      this.registerSort(e);
      this.registerCreateRecordButton(e);
      this.registerEnableDisableButton(e);
      InlineControlContainer.registerInfoButton(e);
      this.registerDeleteButton(e);
      this.registerSynchronizeLocalize(e);
      this.registerRevertUniquenessAction(e);
    });

    this.container.addEventListener('change', (e: Event): void => {
      this.registerCreateRecordBySelector(e);
      this.registerUniqueSelectFieldChanged(e);
    });

    window.addEventListener('message', this.handlePostMessage);

    if (this.getAppearance().useSortable) {
      const recordListContainer = <HTMLDivElement>document.querySelector('#' + this.container.getAttribute('id') + '_records');
      // tslint:disable-next-line:no-unused-expression
      new Sortable(recordListContainer, {
        group: recordListContainer.getAttribute('id'),
        handle: '.sortableHandle',
        onSort: (): void => {
          this.updateSorting();
        },
      });
    }
  }

  /**
   * @param {Event} e
   */
  private registerToggle(e: Event): void {
    if (InlineControlContainer.getDelegatedEventTarget(e.target, Selectors.controlSectionSelector)) {
      // Abort click event in control section
      return;
    }

    let target: HTMLElement;
    if ((target = InlineControlContainer.getDelegatedEventTarget(e.target, Selectors.toggleSelector)) === null) {
      return;
    }

    e.preventDefault();
    e.stopImmediatePropagation();

    this.loadRecordDetails(target.parentElement.dataset.objectId);
  }

  /**
   * @param {Event} e
   */
  private registerSort(e: Event): void {
    let target: HTMLElement;
    if ((target = InlineControlContainer.getDelegatedEventTarget(
      e.target,
      Selectors.controlSectionSelector + ' [data-action="sort"]')
    ) === null) {
      return;
    }

    e.preventDefault();
    e.stopImmediatePropagation();

    this.changeSortingByButton(
      (<HTMLDivElement>target.closest('[data-object-id]')).dataset.objectId,
      <SortDirections>target.dataset.direction,
    );
  }

  /**
   * @param {Event} e
   */
  private registerCreateRecordButton(e: Event): void {
    let target: HTMLElement;
    if ((target = InlineControlContainer.getDelegatedEventTarget(e.target, Selectors.createNewRecordButtonSelector)) === null) {
      return;
    }

    e.preventDefault();
    e.stopImmediatePropagation();

    if (this.isBelowMax()) {
      let objectId = this.container.dataset.objectGroup;
      if (typeof target.dataset.recordUid !== 'undefined') {
        objectId += Separators.structureSeparator + target.dataset.recordUid;
      }

      this.importRecord([objectId], target.dataset.recordUid);
    }
  }

  /**
   * @param {Event} e
   */
  private registerCreateRecordBySelector(e: Event): void {
    let target: HTMLElement;
    if ((target = InlineControlContainer.getDelegatedEventTarget(e.target, Selectors.createNewRecordBySelectorSelector)) === null) {
      return;
    }

    e.preventDefault();
    e.stopImmediatePropagation();

    const selectTarget = <HTMLSelectElement>target;
    const recordUid = selectTarget.options[selectTarget.selectedIndex].getAttribute('value');

    this.importRecord([this.container.dataset.objectGroup, recordUid]);
  }

  /**
   * @param {MessageEvent} e
   */
  private handlePostMessage = (e: MessageEvent): void => {
    if (!MessageUtility.verifyOrigin(e.origin)) {
      throw 'Denied message sent by ' + e.origin;
    }

    if (typeof e.data.objectGroup === 'undefined') {
      throw 'No object group defined for message';
    }

    if (e.data.objectGroup !== this.container.dataset.objectGroup) {
      // Received message isn't provisioned for current InlineControlContainer instance
      return;
    }

    if (this.isUniqueElementUsed(parseInt(e.data.uid, 10), e.data.table)) {
      Notification.error('There is already a relation to the selected element');
      return;
    }

    this.importRecord([e.data.objectGroup, e.data.uid]);
  }

  /**
   * @param {string} uid
   * @param {string} markup
   * @param {string} afterUid
   * @param {string} selectedValue
   */
  private createRecord(uid: string, markup: string, afterUid: string = null, selectedValue: string = null): void {
    let objectId = this.container.dataset.objectGroup;
    if (afterUid !== null) {
      objectId += Separators.structureSeparator + afterUid;
    }

    if (afterUid !== null) {
      InlineControlContainer.getInlineRecordContainer(objectId).insertAdjacentHTML('afterend', markup);
      this.memorizeAddRecord(uid, afterUid, selectedValue);
    } else {
      document.querySelector('#' + this.container.getAttribute('id') + '_records').insertAdjacentHTML('beforeend', markup);
      this.memorizeAddRecord(uid, null, selectedValue);
    }
  }

  /**
   * @param {Array} params
   * @param {string} afterUid
   */
  private importRecord(params: Array<any>, afterUid?: string): void {
    const xhr = this.ajaxDispatcher.send(
      this.ajaxDispatcher.newRequest(this.ajaxDispatcher.getEndpoint('record_inline_create'))
        .withContext()
        .withParams(params),
    );

    xhr.done((response: { [key: string]: any }): void => {
      if (this.isBelowMax()) {
        this.createRecord(
          response.compilerInput.uid,
          response.data,
          typeof afterUid !== 'undefined' ? afterUid : null,
          typeof response.compilerInput.childChildUid !== 'undefined' ? response.compilerInput.childChildUid : null,
        );

        FormEngine.reinitialize();
        FormEngine.Validation.initializeInputFields();
        FormEngine.Validation.validate();
      }
    });
  }

  /**
   * @param {Event} e
   */
  private registerEnableDisableButton(e: Event): void {
    let target: HTMLElement;
    if ((target = InlineControlContainer.getDelegatedEventTarget(
      e.target,
      Selectors.enableDisableRecordButtonSelector)
    ) === null) {
      return;
    }

    e.preventDefault();
    e.stopImmediatePropagation();

    const objectId = (<HTMLDivElement>target.closest('[data-object-id]')).dataset.objectId;
    const recordContainer = InlineControlContainer.getInlineRecordContainer(objectId);
    const hiddenFieldName = 'data' + recordContainer.dataset.fieldName + '[' + target.dataset.hiddenField + ']';
    const hiddenValueCheckBox = <HTMLInputElement>document.querySelector('[data-formengine-input-name="' + hiddenFieldName + '"');
    const hiddenValueInput = <HTMLInputElement>document.querySelector('[name="' + hiddenFieldName + '"');

    if (hiddenValueCheckBox !== null && hiddenValueInput !== null) {
      hiddenValueCheckBox.checked = !hiddenValueCheckBox.checked;
      hiddenValueInput.value = hiddenValueCheckBox.checked ? '1' : '0';
      TBE_EDITOR.fieldChanged_fName(hiddenFieldName, hiddenFieldName);
    }

    const hiddenClass = 't3-form-field-container-inline-hidden';
    const isHidden = recordContainer.classList.contains(hiddenClass);
    let toggleIcon: string = '';

    if (isHidden) {
      toggleIcon = 'actions-edit-hide';
      recordContainer.classList.remove(hiddenClass);
    } else {
      toggleIcon = 'actions-edit-unhide';
      recordContainer.classList.add(hiddenClass);
    }

    Icons.getIcon(toggleIcon, Icons.sizes.small).done((markup: string): void => {
      target.replaceChild(document.createRange().createContextualFragment(markup), target.querySelector('.t3js-icon'));
    });
  }

  /**
   * @param {Event} e
   */
  private registerDeleteButton(e: Event): void {
    let target: HTMLElement;
    if ((target = InlineControlContainer.getDelegatedEventTarget(
      e.target,
      Selectors.deleteRecordButtonSelector)
    ) === null) {
      return;
    }

    e.preventDefault();
    e.stopImmediatePropagation();

    const title = TYPO3.lang['label.confirm.delete_record.title'] || 'Delete this record?';
    const content = TYPO3.lang['label.confirm.delete_record.content'] || 'Are you sure you want to delete this record?';
    const $modal = Modal.confirm(title, content, Severity.warning, [
      {
        text: TYPO3.lang['buttons.confirm.delete_record.no'] || 'Cancel',
        active: true,
        btnClass: 'btn-default',
        name: 'no',
      },
      {
        text: TYPO3.lang['buttons.confirm.delete_record.yes'] || 'Yes, delete this record',
        btnClass: 'btn-warning',
        name: 'yes',
      },
    ]);
    $modal.on('button.clicked', (modalEvent: Event): void => {
      if ((<HTMLAnchorElement>modalEvent.target).name === 'yes') {
        const objectId = (<HTMLDivElement>target.closest('[data-object-id]')).dataset.objectId;
        this.deleteRecord(objectId);
      }

      Modal.dismiss();
    });
  }

  /**
   * @param {Event} e
   */
  private registerSynchronizeLocalize(e: Event): void {
    let target;
    if ((target = InlineControlContainer.getDelegatedEventTarget(e.target, Selectors.synchronizeLocalizeRecordButtonSelector)) === null) {
      return;
    }

    const xhr = this.ajaxDispatcher.send(
      this.ajaxDispatcher.newRequest(this.ajaxDispatcher.getEndpoint('record_inline_synchronizelocalize'))
        .withContext()
        .withParams([this.container.dataset.objectGroup, target.dataset.type]),
    );

    xhr.done((response: { [key: string]: any }): void => {
      document.querySelector('#' + this.container.getAttribute('id') + '_records').insertAdjacentHTML('beforeend', response.data);

      const objectIdPrefix = this.container.dataset.objectGroup + Separators.structureSeparator;
      for (let itemUid of response.compilerInput.delete) {
        this.deleteRecord(objectIdPrefix + itemUid, true);
      }

      for (let item of response.compilerInput.localize) {
        if (typeof item.remove !== 'undefined') {
          const removableRecordContainer = InlineControlContainer.getInlineRecordContainer(objectIdPrefix + item.remove);
          removableRecordContainer.parentElement.removeChild(removableRecordContainer);
        }

        this.memorizeAddRecord(item.uid, null, item.selectedValue);
      }
    });
  }

  /**
   * @param {Event} e
   */
  private registerUniqueSelectFieldChanged(e: Event): void {
    let target;
    if ((target = InlineControlContainer.getDelegatedEventTarget(e.target, Selectors.uniqueValueSelectors)) === null) {
      return;
    }

    const recordContainer = (<HTMLDivElement>target.closest('[data-object-id]'));
    if (recordContainer !== null) {
      const objectId = recordContainer.dataset.objectId;
      const objectUid = recordContainer.dataset.objectUid;
      this.handleChangedField(<HTMLSelectElement>target, objectId);

      const formField = this.getFormFieldForElements();
      if (formField === null) {
        return;
      }
      this.updateUnique(<HTMLSelectElement>target, formField, objectUid);
    }
  }

  /**
   * @param {Event} e
   */
  private registerRevertUniquenessAction(e: Event): void {
    let target;
    if ((target = InlineControlContainer.getDelegatedEventTarget(e.target, Selectors.revertUniqueness)) === null) {
      return;
    }

    this.revertUnique(target.dataset.uid);
  }

  /**
   * @param {string} objectId
   */
  private loadRecordDetails(objectId: string): void {
    const recordFieldsContainer = document.querySelector('#' + objectId + '_fields');
    const isLoading = typeof this.xhrQueue[objectId] !== 'undefined';
    const isLoaded = recordFieldsContainer !== null && recordFieldsContainer.innerHTML.substr(0, 16) !== '<!--notloaded-->';

    if (!isLoaded) {
      const progress = this.getProgress(objectId);

      if (!isLoading) {
        const xhr = this.ajaxDispatcher.send(
          this.ajaxDispatcher.newRequest(this.ajaxDispatcher.getEndpoint('record_inline_details'))
            .withContext()
            .withParams([objectId]),
        );
        xhr.done((response: InlineResponseInterface): void => {
          delete this.xhrQueue[objectId];
          delete this.progessQueue[objectId];

          recordFieldsContainer.innerHTML = response.data;
          this.collapseExpandRecord(objectId);

          progress.done();

          FormEngine.reinitialize();
          FormEngine.Validation.initializeInputFields();
          FormEngine.Validation.validate();

          if (this.hasObjectGroupDefinedUniqueConstraints()) {
            const recordContainer = InlineControlContainer.getInlineRecordContainer(objectId);
            this.removeUsed(recordContainer);
          }
        });

        this.xhrQueue[objectId] = xhr;
        progress.start();
      } else {
        // Abort loading if collapsed again
        this.xhrQueue[objectId].abort();
        delete this.xhrQueue[objectId];
        delete this.progessQueue[objectId];
        progress.done();
      }

      return;
    }

    this.collapseExpandRecord(objectId);
  }

  /**
   * Collapses or expands a record and stores the state either in a form field or directly in backend user's UC, depending
   * on whether the record is new or already existing.
   *
   * @param {String} objectId
   */
  private collapseExpandRecord(objectId: string): void {
    const recordElement = InlineControlContainer.getInlineRecordContainer(objectId);
    const expandSingle = this.getAppearance().expandSingle === true;
    const isCollapsed: boolean = recordElement.classList.contains(States.collapsed);
    let collapse: Array<string> = [];
    const expand: Array<string> = [];

    if (expandSingle && isCollapsed) {
      collapse = this.collapseAllRecords(recordElement.dataset.objectUid);
    }

    InlineControlContainer.toggleElement(objectId);

    if (InlineControlContainer.isNewRecord(objectId)) {
      InlineControlContainer.updateExpandedCollapsedStateLocally(objectId, isCollapsed);
    } else if (isCollapsed) {
      expand.push(recordElement.dataset.objectUid);
    } else if (!isCollapsed) {
      collapse.push(recordElement.dataset.objectUid);
    }

    this.ajaxDispatcher.send(
      this.ajaxDispatcher.newRequest(this.ajaxDispatcher.getEndpoint('record_inline_expandcollapse'))
        .withContext()
        .withParams([objectId, expand.join(','), collapse.join(',')]),
    );
  }

  /**
   * @param {string} newUid
   * @param {string} afterUid
   * @param {string} selectedValue
   */
  private memorizeAddRecord(newUid: string, afterUid: string = null, selectedValue: string = null): void {
    const formField = this.getFormFieldForElements();
    if (formField === null) {
      return;
    }

    let records = Utility.trimExplode(',', (<HTMLInputElement>formField).value);
    if (afterUid) {
      const newRecords = [];
      for (let i = 0; i < records.length; i++) {
        if (records[i].length) {
          newRecords.push(records[i]);
        }
        if (afterUid === records[i]) {
          newRecords.push(newUid);
        }
      }
      records = newRecords;
    } else {
      records.push(newUid);
    }

    (<HTMLInputElement>formField).value = records.join(',');
    (<HTMLInputElement>formField).classList.add('has-change');
    $(document).trigger('change');

    this.redrawSortingButtons(this.container.dataset.objectGroup, records);
    this.setUnique(newUid, selectedValue);

    if (!this.isBelowMax()) {
      this.toggleContainerControls(false);
    }

    TBE_EDITOR.fieldChanged_fName((<HTMLInputElement>formField).name, formField);
  }

  /**
   * @param {String} objectUid
   * @return Array<string>
   */
  private memorizeRemoveRecord(objectUid: string): Array<string> {
    const formField = this.getFormFieldForElements();
    if (formField === null) {
      return [];
    }

    let records = Utility.trimExplode(',', (<HTMLInputElement>formField).value);
    const indexOfRemoveUid = records.indexOf(objectUid);
    if (indexOfRemoveUid > -1) {
      delete records[indexOfRemoveUid];

      (<HTMLInputElement>formField).value = records.join(',');
      (<HTMLInputElement>formField).classList.add('has-change');
      $(document).trigger('change');

      this.redrawSortingButtons(this.container.dataset.objectGroup, records);
    }

    return records;
  }

  /**
   * @param {string} objectId
   * @param {SortDirections} direction
   */
  private changeSortingByButton(objectId: string, direction: SortDirections): void {
    const currentRecordContainer = InlineControlContainer.getInlineRecordContainer(objectId);
    const recordUid = currentRecordContainer.dataset.objectUid;
    const recordListContainer = <HTMLDivElement>document.querySelector('#' + this.container.getAttribute('id') + '_records');
    const records = Array.from(recordListContainer.children).map((child: HTMLElement) => child.dataset.objectUid);
    let position = records.indexOf(recordUid);
    let isChanged = false;

    if (direction === SortDirections.UP && position > 0) {
      records[position] = records[position - 1];
      records[position - 1] = recordUid;
      isChanged = true;
    } else if (direction === SortDirections.DOWN && position < records.length - 1) {
      records[position] = records[position + 1];
      records[position + 1] = recordUid;
      isChanged = true;
    }

    if (isChanged) {
      const objectIdPrefix = this.container.dataset.objectGroup + Separators.structureSeparator;
      const adjustment = direction === SortDirections.UP ? 1 : 0;
      currentRecordContainer.parentElement.insertBefore(
        InlineControlContainer.getInlineRecordContainer(objectIdPrefix + records[position - adjustment]),
        InlineControlContainer.getInlineRecordContainer(objectIdPrefix + records[position + 1 - adjustment]),
      );

      this.updateSorting();
    }
  }

  private updateSorting(): void {
    const formField = this.getFormFieldForElements();
    if (formField === null) {
      return;
    }

    const recordListContainer = <HTMLDivElement>document.querySelector('#' + this.container.getAttribute('id') + '_records');
    const records = Array.from(recordListContainer.children).map((child: HTMLElement) => child.dataset.objectUid);

    (<HTMLInputElement>formField).value = records.join(',');
    (<HTMLInputElement>formField).classList.add('has-change');
    $(document).trigger('inline:sorting-changed');
    $(document).trigger('change');

    this.redrawSortingButtons(this.container.dataset.objectGroup, records);
  }

  /**
   * @param {String} objectId
   * @param {Boolean} forceDirectRemoval
   */
  private deleteRecord(objectId: string, forceDirectRemoval: boolean = false): void {
    const recordContainer = InlineControlContainer.getInlineRecordContainer(objectId);
    const objectUid = recordContainer.dataset.objectUid;

    recordContainer.classList.add('t3js-inline-record-deleted');

    if (!InlineControlContainer.isNewRecord(objectId) && !forceDirectRemoval) {
      const deleteCommandInput = this.container.querySelector('[name="cmd' + recordContainer.dataset.fieldName + '[delete]"]');
      deleteCommandInput.removeAttribute('disabled');

      // Move input field to inline container so we can remove the record container
      recordContainer.parentElement.insertAdjacentElement('afterbegin', deleteCommandInput);
    }

    recordContainer.addEventListener('transitionend', (): void => {
      recordContainer.parentElement.removeChild(recordContainer);
      FormEngineValidation.validate();
    });

    this.revertUnique(objectUid);
    this.memorizeRemoveRecord(objectUid);
    recordContainer.classList.add('form-irre-object--deleted');

    if (this.isBelowMax()) {
      this.toggleContainerControls(true);
    }
  }

  /**
   * @param {boolean} visible
   */
  private toggleContainerControls(visible: boolean): void {
    const controlContainerButtons = this.container.querySelectorAll(Selectors.controlContainerButtons + ' a');
    controlContainerButtons.forEach((button: HTMLElement): void => {
      button.style.display = visible ? null : 'none';
    });
  }

  /**
   * @param {string} objectId
   */
  private getProgress(objectId: string): any {
    const headerIdentifier = '#' + objectId + '_header';
    let progress: any;

    if (typeof this.progessQueue[objectId] !== 'undefined') {
      progress = this.progessQueue[objectId];
    } else {
      progress = NProgress;
      progress.configure({parent: headerIdentifier, showSpinner: false});
      this.progessQueue[objectId] = progress;
    }

    return progress;
  }

  /**
   * @param {string} excludeUid
   */
  private collapseAllRecords(excludeUid: string): Array<string> {
    const formField = this.getFormFieldForElements();
    const collapse: Array<string> = [];

    if (formField !== null) {
      const records = Utility.trimExplode(',', (<HTMLInputElement>formField).value);
      for (let recordUid of records) {
        if (recordUid === excludeUid) {
          continue;
        }

        const recordObjectId = this.container.dataset.objectGroup + Separators.structureSeparator + recordUid;
        const recordContainer = InlineControlContainer.getInlineRecordContainer(recordObjectId);
        if (recordContainer.classList.contains(States.visible)) {
          recordContainer.classList.remove(States.visible);
          recordContainer.classList.add(States.collapsed);

          if (InlineControlContainer.isNewRecord(recordObjectId)) {
            InlineControlContainer.updateExpandedCollapsedStateLocally(recordObjectId, false);
          } else {
            collapse.push(recordUid);
          }
        }
      }
    }

    return collapse;
  }

  /**
   * @return HTMLInputElement | void
   */
  private getFormFieldForElements(): HTMLInputElement | null {
    const formFields = document.getElementsByName(this.container.dataset.formField);
    if (formFields.length > 0) {
      return <HTMLInputElement>formFields[0];
    }

    return null;
  }

  /**
   * Redraws rhe sorting buttons of each record
   *
   * @param {string} objectId
   * @param {Array<string>} records
   */
  private redrawSortingButtons(objectId: string, records: Array<string> = []): void {
    if (records.length === 0) {
      const formField = this.getFormFieldForElements();
      if (formField !== null) {
        records = Utility.trimExplode(',', (<HTMLInputElement>formField).value);
      }
    }

    if (records.length === 0) {
      return;
    }

    records.forEach((recordUid: string, index: number): void => {
      const headerIdentifier = '#' + objectId + Separators.structureSeparator + recordUid + '_header';
      const headerElement = document.querySelector(headerIdentifier);

      const sortUp = headerElement.querySelector('[data-action="sort"][data-direction="' + SortDirections.UP + '"]');
      if (sortUp !== null) {
        let iconIdentifier = 'actions-move-up';
        if (index === 0) {
          sortUp.classList.add('disabled');
          iconIdentifier = 'empty-empty';
        } else {
          sortUp.classList.remove('disabled');
        }
        Icons.getIcon(iconIdentifier, Icons.sizes.small).done((markup: string): void => {
          sortUp.replaceChild(document.createRange().createContextualFragment(markup), sortUp.querySelector('.t3js-icon'));
        });
      }

      const sortDown = headerElement.querySelector('[data-action="sort"][data-direction="' + SortDirections.DOWN + '"]');
      if (sortDown !== null) {
        let iconIdentifier = 'actions-move-down';
        if (index === records.length - 1) {
          sortDown.classList.add('disabled');
          iconIdentifier = 'empty-empty';
        } else {
          sortDown.classList.remove('disabled');
        }
        Icons.getIcon(iconIdentifier, Icons.sizes.small).done((markup: string): void => {
          sortDown.replaceChild(document.createRange().createContextualFragment(markup), sortDown.querySelector('.t3js-icon'));
        });
      }
    });
  }

  /**
   * @return {boolean}
   */
  private isBelowMax(): boolean {
    const formField = this.getFormFieldForElements();
    if (formField === null) {
      return true;
    }

    if (typeof TYPO3.settings.FormEngineInline.config[this.container.dataset.objectGroup] !== 'undefined') {
      const records = Utility.trimExplode(',', (<HTMLInputElement>formField).value);
      if (records.length >= TYPO3.settings.FormEngineInline.config[this.container.dataset.objectGroup].max) {
        return false;
      }

      if (this.hasObjectGroupDefinedUniqueConstraints()) {
        const unique = TYPO3.settings.FormEngineInline.unique[this.container.dataset.objectGroup];
        if (unique.used.length >= unique.max && unique.max >= 0) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * @param {number} uid
   * @param {string} table
   */
  private isUniqueElementUsed(uid: number, table: string): boolean {
    if (!this.hasObjectGroupDefinedUniqueConstraints()) {
      return false;
    }

    const unique: UniqueDefinition = TYPO3.settings.FormEngineInline.unique[this.container.dataset.objectGroup];
    const values = InlineControlContainer.getValuesFromHashMap(unique.used);

    if (unique.type === 'select' && values.indexOf(uid) !== -1) {
      return true;
    }

    if (unique.type === 'groupdb') {
      for (let i = values.length - 1; i >= 0; i--) {
        // if the pair table:uid is already used:
        if (values[i].table === table && values[i].uid === uid) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * @param {HTMLDivElement} recordContainer
   */
  private removeUsed(recordContainer: HTMLDivElement): void {
    if (!this.hasObjectGroupDefinedUniqueConstraints()) {
      return;
    }

    const unique: UniqueDefinition = TYPO3.settings.FormEngineInline.unique[this.container.dataset.objectGroup];
    if (unique.type !== 'select') {
      return;
    }

    let uniqueValueField = <HTMLSelectElement>recordContainer.querySelector(
      '[name="data[' + unique.table + '][' + recordContainer.dataset.objectUid + '][' + unique.field + ']"]',
    );
    const values = InlineControlContainer.getValuesFromHashMap(unique.used);

    if (uniqueValueField !== null) {
      const selectedValue = uniqueValueField.options[uniqueValueField.selectedIndex].value;
      for (let value of values) {
        if (value !== selectedValue) {
          InlineControlContainer.removeSelectOptionByValue(uniqueValueField, value);
        }
      }
    }
  }

  /**
   * @param {string} recordUid
   * @param {string} selectedValue
   */
  private setUnique(recordUid: string, selectedValue: string): void {
    if (!this.hasObjectGroupDefinedUniqueConstraints()) {
      return;
    }
    const selectorElement: HTMLSelectElement = <HTMLSelectElement>document.querySelector(
      '#' + this.container.dataset.objectGroup + '_selector',
    );
    const unique: UniqueDefinition = TYPO3.settings.FormEngineInline.unique[this.container.dataset.objectGroup];
    if (unique.type === 'select') {
      if (!(unique.selector && unique.max === -1)) {
        const formField = this.getFormFieldForElements();
        const recordObjectId = this.container.dataset.objectGroup + Separators.structureSeparator + recordUid;
        const recordContainer = InlineControlContainer.getInlineRecordContainer(recordObjectId);
        let uniqueValueField = <HTMLSelectElement>recordContainer.querySelector(
          '[name="data[' + unique.table + '][' + recordUid + '][' + unique.field + ']"]',
        );
        const values = InlineControlContainer.getValuesFromHashMap(unique.used);
        if (selectorElement !== null) {
          // remove all items from the new select-item which are already used in other children
          if (uniqueValueField !== null) {
            for (let value of values) {
              InlineControlContainer.removeSelectOptionByValue(uniqueValueField, value);
            }
            // set the selected item automatically to the first of the remaining items if no selector is used
            if (!unique.selector) {
              selectedValue = uniqueValueField.options[0].value;
              uniqueValueField.options[0].selected = true;
              this.updateUnique(uniqueValueField, formField, recordUid);
              this.handleChangedField(uniqueValueField, this.container.dataset.objectGroup + '[' + recordUid + ']');
            }
          }
          for (let value of values) {
            InlineControlContainer.removeSelectOptionByValue(uniqueValueField, value);
          }
          if (typeof unique.used.length !== 'undefined') {
            unique.used = {};
          }
          unique.used[recordUid] = {
            table: unique.elTable,
            uid: selectedValue,
          };
        }
        // remove the newly used item from each select-field of the child records
        if (formField !== null && InlineControlContainer.selectOptionValueExists(selectorElement, selectedValue)) {
          const records = Utility.trimExplode(',', (<HTMLInputElement>formField).value);
          for (let record of records) {
            uniqueValueField = <HTMLSelectElement>document.querySelector(
              '[name="data[' + unique.table + '][' + record + '][' + unique.field + ']"]',
            );
            if (uniqueValueField !== null && record !== recordUid) {
              InlineControlContainer.removeSelectOptionByValue(uniqueValueField, selectedValue);
            }
          }
        }
      }
    } else if (unique.type === 'groupdb') {
      // add the new record to the used items:
      unique.used[recordUid] = {
        table: unique.elTable,
        uid: selectedValue,
      };
    }

    // remove used items from a selector-box
    if (unique.selector === 'select' && InlineControlContainer.selectOptionValueExists(selectorElement, selectedValue)) {
      InlineControlContainer.removeSelectOptionByValue(selectorElement, selectedValue);
      unique.used[recordUid] = {
        table: unique.elTable,
        uid: selectedValue,
      };
    }
  }

  /**
   * @param {HTMLSelectElement} srcElement
   * @param {HTMLInputElement} formField
   * @param {string} recordUid
   */
  private updateUnique(srcElement: HTMLSelectElement, formField: HTMLInputElement, recordUid: string): void {
    if (!this.hasObjectGroupDefinedUniqueConstraints()) {
      return;
    }
    const unique = TYPO3.settings.FormEngineInline.unique[this.container.dataset.objectGroup];
    const oldValue = unique.used[recordUid];

    if (unique.selector === 'select') {
      const selectorElement: HTMLSelectElement = <HTMLSelectElement>document.querySelector(
        '#' + this.container.dataset.objectGroup + '_selector',
      );
      InlineControlContainer.removeSelectOptionByValue(selectorElement, srcElement.value);
      if (typeof oldValue !== 'undefined') {
        InlineControlContainer.reAddSelectOption(selectorElement, oldValue, unique);
      }
    }

    if (unique.selector && unique.max === -1) {
      return;
    }

    if (!unique || formField === null) {
      return;
    }

    const records = Utility.trimExplode(',', formField.value);
    let uniqueValueField;
    for (let record of records) {
      uniqueValueField = <HTMLSelectElement>document.querySelector(
        '[name="data[' + unique.table + '][' + record + '][' + unique.field + ']"]',
      );
      if (uniqueValueField !== null && uniqueValueField !== srcElement) {
        InlineControlContainer.removeSelectOptionByValue(uniqueValueField, srcElement.value);
        if (typeof oldValue !== 'undefined') {
          InlineControlContainer.reAddSelectOption(uniqueValueField, oldValue, unique);
        }
      }
    }
    unique.used[recordUid] = srcElement.value;
  }

  /**
   * @param {string} recordUid
   */
  private revertUnique(recordUid: string): void {
    if (!this.hasObjectGroupDefinedUniqueConstraints()) {
      return;
    }

    const unique = TYPO3.settings.FormEngineInline.unique[this.container.dataset.objectGroup];
    const recordObjectId = this.container.dataset.objectGroup + Separators.structureSeparator + recordUid;
    const recordContainer = InlineControlContainer.getInlineRecordContainer(recordObjectId);

    let uniqueValueField = <HTMLSelectElement>recordContainer.querySelector(
      '[name="data[' + unique.table + '][' + recordContainer.dataset.objectUid + '][' + unique.field + ']"]',
    );
    if (unique.type === 'select') {
      let uniqueValue;
      if (uniqueValueField !== null) {
        uniqueValue = uniqueValueField.value;
      } else if (recordContainer.dataset.tableUniqueOriginalValue !== '') {
        uniqueValue = recordContainer.dataset.tableUniqueOriginalValue;
      } else {
        return;
      }

      if (unique.selector === 'select') {
        if (!isNaN(parseInt(uniqueValue, 10))) {
          const selectorElement: HTMLSelectElement = <HTMLSelectElement>document.querySelector(
            '#' + this.container.dataset.objectGroup + '_selector',
          );
          InlineControlContainer.reAddSelectOption(selectorElement, uniqueValue, unique);
        }
      }

      if (unique.selector && unique.max === -1) {
        return;
      }

      const formField = this.getFormFieldForElements();
      if (formField === null) {
        return;
      }

      const records = Utility.trimExplode(',', formField.value);
      let recordObj;
      // walk through all inline records on that level and get the select field
      for (let i = 0; i < records.length; i++) {
        recordObj = <HTMLSelectElement>document.querySelector(
          '[name="data[' + unique.table + '][' + records[i] + '][' + unique.field + ']"]',
        );
        if (recordObj !== null) {
          InlineControlContainer.reAddSelectOption(recordObj, uniqueValue, unique);
        }
      }

      delete unique.used[recordUid];
    } else if (unique.type === 'groupdb') {
      delete unique.used[recordUid];
    }
  }

  /**
   * @return {boolean}
   */
  private hasObjectGroupDefinedUniqueConstraints(): boolean {
    return typeof TYPO3.settings.FormEngineInline.unique !== 'undefined'
      && typeof TYPO3.settings.FormEngineInline.unique[this.container.dataset.objectGroup] !== 'undefined';
  }

  /**
   * @param {HTMLInputElement | HTMLSelectElement} formField
   * @param {string} objectId
   */
  private handleChangedField(formField: HTMLInputElement | HTMLSelectElement, objectId: string): void {
    let value;
    if (formField instanceof HTMLSelectElement) {
      value = formField.options[formField.selectedIndex].text;
    } else {
      value = formField.value;
    }
    document.querySelector('#' + objectId + '_label').textContent = value.length ? value : this.noTitleString;
  }

  /**
   * @return {Object}
   */
  private getAppearance(): Appearance {
    if (this.appearance === null) {
      this.appearance = {};

      if (typeof this.container.dataset.appearance === 'string') {
        try {
          this.appearance = JSON.parse(this.container.dataset.appearance);
        } catch (e) {
          console.error(e);
        }
      }
    }

    return this.appearance;
  }
}

export = InlineControlContainer;
