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

import {SeverityEnum} from 'TYPO3/CMS/Backend/Enum/Severity';
import 'twbs/bootstrap-slider';
import * as $ from 'jquery';
import Modal = require('TYPO3/CMS/Backend/Modal');
import Utility = require('TYPO3/CMS/Backend/Utility');
import Workspaces from './Workspaces';

enum Identifiers {
  topbar = '#typo3-topbar',
  workspacePanel = '.workspace-panel',
  liveView = '#live-view',
  workspaceTabs = '.t3js-workspace-tabs [data-toggle="tab"]',
  workspaceActions = '.t3js-workspace-actions',
  stageSlider = '#workspace-stage-slider',
  workspaceView = '#workspace-view',
  workspaceList = '#workspace-list',
  sendToStageAction = '[data-action="send-to-stage"]',
  discardAction = '[data-action="discard"]',
  stageButtonsContainer = '.t3js-stage-buttons',
  previewModeContainer = '.t3js-preview-mode',
  activePreviewMode = '.t3js-active-preview-mode',
  workspacePreview = '.t3js-workspace-preview',
}

class Preview extends Workspaces {
  private currentSlidePosition: number = 100;
  private elements: { [key: string]: JQuery } = {};

  /**
   * Calculate the available space based on the viewport height
   *
   * @returns {Number}
   */
  private static getAvailableSpace(): number {
    const $viewportHeight = $(window).height();
    const $topbarHeight = $(Identifiers.topbar).outerHeight();

    return $viewportHeight - $topbarHeight;
  }

  constructor() {
    super();

    $((): void => {
      this.getElements();
      this.resizeViews();
      this.adjustPreviewModeSelectorWidth();
      this.elements.$stageSlider.slider();
      this.registerEvents();
    });
  }

  /**
   * Fetches and stores often required elements
   */
  private getElements(): void {
    this.elements.$liveView = $(Identifiers.liveView);
    this.elements.$workspacePanel = $(Identifiers.workspacePanel);
    this.elements.$workspaceTabs = $(Identifiers.workspaceTabs);
    this.elements.$workspaceActions = $(Identifiers.workspaceActions);
    this.elements.$stageSlider = $(Identifiers.stageSlider);
    this.elements.$workspaceView = $(Identifiers.workspaceView);
    this.elements.$workspaceList = $(Identifiers.workspaceList);
    this.elements.$stageButtonsContainer = $(Identifiers.stageButtonsContainer);
    this.elements.$previewModeContainer = $(Identifiers.previewModeContainer);
    this.elements.$activePreviewMode = $(Identifiers.activePreviewMode);
    this.elements.$workspacePreview = $(Identifiers.workspacePreview);
  }

  /**
   * Registers the events
   */
  private registerEvents(): void {
    $(window).on('resize', (): void => {
      this.resizeViews();
    });
    $(document)
      .on('click', Identifiers.discardAction, this.renderDiscardWindow)
      .on('click', Identifiers.sendToStageAction, this.renderSendPageToStageWindow)
    ;

    this.elements.$workspaceTabs.on('show.bs.tab', (e: JQueryEventObject): void => {
      this.elements.$workspaceActions.toggle((<HTMLElement>e.currentTarget).dataset.actions);
    });
    this.elements.$stageSlider.on('change', this.updateSlidePosition);
    this.elements.$previewModeContainer.find('[data-preview-mode]').on('click', this.changePreviewMode);
  }

  /**
   * Renders the staging buttons
   *
   * @param {String} buttons
   */
  private renderStageButtons(buttons: string): void {
    this.elements.$stageButtonsContainer.html(buttons);
  }

  /**
   * Updates the position of the comparison slider
   *
   * @param {Event} e
   */
  private updateSlidePosition = (e: any): void => {
    this.currentSlidePosition = e.value.newValue;
    this.resizeViews();
  }

  /**
   * Resize the views based on the current viewport height and slider position
   */
  private resizeViews(): void {
    const availableSpace = Preview.getAvailableSpace();
    const relativeHeightOfLiveView = (this.currentSlidePosition - 100) * -1;
    const absoluteHeightOfLiveView = Math.round(Math.abs(availableSpace * relativeHeightOfLiveView / 100));
    const outerHeightDifference = this.elements.$liveView.outerHeight() - this.elements.$liveView.height();

    this.elements.$workspacePreview.height(availableSpace);

    if (this.elements.$activePreviewMode.data('activePreviewMode') === 'slider') {
      this.elements.$liveView.height(absoluteHeightOfLiveView - outerHeightDifference);
    }
    this.elements.$workspaceList.height(availableSpace);
  }

  /**
   * Renders the discard window
   */
  private renderDiscardWindow = (): void => {
    const $modal = Modal.confirm(
      TYPO3.lang['window.discardAll.title'],
      TYPO3.lang['window.discardAll.message'],
      SeverityEnum.warning,
      [
        {
          text: TYPO3.lang.cancel,
          active: true,
          btnClass: 'btn-default',
          name: 'cancel',
          trigger: (): void => {
            $modal.modal('hide');
          },
        },
        {
          text: TYPO3.lang.ok,
          btnClass: 'btn-warning',
          name: 'ok',
        },
      ],
    );
    $modal.on('button.clicked', (e: JQueryEventObject): void => {
      if ((<HTMLAnchorElement>e.target).name === 'ok') {
        this.sendRemoteRequest([
          this.generateRemoteActionsPayload('discardStagesFromPage', [TYPO3.settings.Workspaces.id]),
          this.generateRemoteActionsPayload('updateStageChangeButtons', [TYPO3.settings.Workspaces.id]),
        ]).done((response: Array<any>): void => {
          $modal.modal('hide');
          this.renderStageButtons(response[1].result);
          // Reloading live view and and workspace list view IFRAME
          this.elements.$workspaceView.attr('src', this.elements.$workspaceView.attr('src'));
          this.elements.$workspaceList.attr('src', this.elements.$workspaceList.attr('src'));
        });
      }
    });
  }

  /**
   * Adjusts the width of the preview mode selector to avoid jumping around due to different widths of the labels
   */
  private adjustPreviewModeSelectorWidth(): void {
    const $btnGroup = this.elements.$previewModeContainer.find('.btn-group');
    let maximumWidth = 0;

    $btnGroup.addClass('open');
    this.elements.$previewModeContainer.find('li > a > span').each((_: number, el: Element): void => {
      const width = $(el).width();
      if (maximumWidth < width) {
        maximumWidth = width;
      }
    });
    $btnGroup.removeClass('open');
    this.elements.$activePreviewMode.width(maximumWidth);
  }

  /**
   * Renders the "send page to stage" window
   */
  private renderSendPageToStageWindow = (e: JQueryEventObject): void => {
    const me = (<HTMLElement>e.currentTarget);
    const direction = me.dataset.direction;
    let actionName;

    if (direction === 'prev') {
      actionName = 'sendPageToPreviousStage';
    } else if (direction === 'next') {
      actionName = 'sendPageToNextStage';
    } else {
      throw 'Invalid direction ' + direction + ' requested.';
    }

    this.sendRemoteRequest(
      this.generateRemoteActionsPayload(actionName, [TYPO3.settings.Workspaces.id]),
    ).done((response: any): void => {
      const $modal = this.renderSendToStageWindow(response);
      $modal.on('button.clicked', (modalEvent: JQueryEventObject): void => {
        if ((<HTMLAnchorElement>modalEvent.target).name === 'ok') {
          const serializedForm = Utility.convertFormToObject(modalEvent.currentTarget.querySelector('form'));
          serializedForm.affects = response[0].result.affects;
          serializedForm.stageId = me.dataset.stageId;

          this.sendRemoteRequest([
            this.generateRemoteActionsPayload('sentCollectionToStage', [serializedForm]),
            this.generateRemoteActionsPayload('updateStageChangeButtons', [TYPO3.settings.Workspaces.id]),
          ]).done((updateResponse: any): void => {
            $modal.modal('hide');

            this.renderStageButtons(updateResponse[1].result);
          });
        }
      });
    });
  }

  /**
   * Changes the preview mode
   *
   * @param {Event} e
   */
  private changePreviewMode = (e: JQueryEventObject): void => {
    e.preventDefault();

    const $trigger = $(e.currentTarget);
    const currentPreviewMode = this.elements.$activePreviewMode.data('activePreviewMode');
    const newPreviewMode = $trigger.data('previewMode');

    this.elements.$activePreviewMode.text($trigger.text()).data('activePreviewMode', newPreviewMode);
    this.elements.$workspacePreview.parent()
      .removeClass('preview-mode-' + currentPreviewMode)
      .addClass('preview-mode-' + newPreviewMode);

    if (newPreviewMode === 'slider') {
      this.elements.$stageSlider.parent().toggle(true);
      this.resizeViews();
    } else {
      this.elements.$stageSlider.parent().toggle(false);

      if (newPreviewMode === 'vbox') {
        this.elements.$liveView.height('100%');
      } else {
        this.elements.$liveView.height('50%');
      }
    }
  }
}

export = new Preview();
