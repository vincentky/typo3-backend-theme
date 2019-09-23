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
import ModuleMenu = require('TYPO3/CMS/Backend/ModuleMenu');
import Viewport = require('TYPO3/CMS/Backend/Viewport');

enum Identifiers {
  containerSelector = '#typo3-cms-workspaces-backend-toolbaritems-workspaceselectortoolbaritem',
  activeMenuItemLinkSelector = '.dropdown-menu .selected',
  menuItemSelector = '.t3js-workspace-item',
  menuItemLinkSelector = '.t3js-workspaces-switchlink',
  toolbarItemSelector = '.dropdown-toggle',
  workspaceModuleLinkSelector = '.t3js-workspaces-modulelink',
}

enum Classes {
  workspaceBodyClass = 'typo3-in-workspace',
  workspacesTitleInToolbarClass = 'toolbar-item-name',
}

/**
 * Module: TYPO3/CMS/Workspaces/Toolbar/WorkspacesMenu
 * toolbar menu for the workspaces functionality to switch between the workspaces
 * and jump to the workspaces module
 */
class WorkspacesMenu {
  /**
   * Refresh the page tree
   */
  private static refreshPageTree(): void {
    if (Viewport.NavigationContainer && Viewport.NavigationContainer.PageTree) {
      Viewport.NavigationContainer.PageTree.refreshTree();
    }
  }

  /**
   * adds the workspace title to the toolbar next to the username
   *
   * @param {String} workspaceTitle
   */
  private static updateTopBar(workspaceTitle: string): void {
    $('.' + Classes.workspacesTitleInToolbarClass, Identifiers.containerSelector).remove();

    if (workspaceTitle && workspaceTitle.length) {
      let title = $('<span>', {
        'class': Classes.workspacesTitleInToolbarClass,
      }).text(workspaceTitle);
      $(Identifiers.toolbarItemSelector, Identifiers.containerSelector).append(title);
    }
  }

  private static updateBackendContext(title: string = ''): void {
    let topBarTitle = '';
    if (TYPO3.configuration.inWorkspace) {
      $('body').addClass(Classes.workspaceBodyClass);
      topBarTitle = title || TYPO3.lang['Workspaces.workspaceTitle'];
    } else {
      $('body').removeClass(Classes.workspaceBodyClass);
    }

    WorkspacesMenu.updateTopBar(topBarTitle);
  }

  constructor() {
    Viewport.Topbar.Toolbar.registerEvent((): void => {
      this.initializeEvents();
      WorkspacesMenu.updateBackendContext();
    });
  }

  /**
   * Changes the data in the module menu and the updates the backend context
   * This method is also used in the workspaces backend module.
   *
   * @param {Number} id the workspace ID
   * @param {String} title the workspace title
   */
  public performWorkspaceSwitch(id: number, title: string): void {
    top.TYPO3.Backend.workspaceTitle = title;
    top.TYPO3.configuration.inWorkspace = id !== 0;

    WorkspacesMenu.updateBackendContext(title);

    // first remove all checks, then set the check in front of the selected workspace
    const stateActiveClass = 'fa fa-check';
    const stateInactiveClass = 'fa fa-empty-empty';

    // remove "selected" class and checkmark
    $(Identifiers.activeMenuItemLinkSelector + ' i', Identifiers.containerSelector)
      .removeClass(stateActiveClass)
      .addClass(stateInactiveClass);
    $(Identifiers.activeMenuItemLinkSelector, Identifiers.containerSelector).removeClass('selected');

    // add "selected" class and checkmark
    const $activeElement = $(Identifiers.menuItemLinkSelector + '[data-workspaceid=' + id + ']', Identifiers.containerSelector);
    const $menuItem = $activeElement.closest(Identifiers.menuItemSelector);
    $menuItem.find('i')
      .removeClass(stateInactiveClass)
      .addClass(stateActiveClass);
    $menuItem.addClass('selected');
  }

  private initializeEvents(): void {
    $(Identifiers.containerSelector).on('click', Identifiers.workspaceModuleLinkSelector, (evt: JQueryEventObject): void => {
      evt.preventDefault();
      ModuleMenu.App.showModule((<HTMLAnchorElement>evt.currentTarget).dataset.module);
    });

    $(Identifiers.containerSelector).on('click', Identifiers.menuItemLinkSelector, (evt: JQueryEventObject): void => {
      evt.preventDefault();
      this.switchWorkspace(parseInt((<HTMLAnchorElement>evt.currentTarget).dataset.workspaceid, 10));
    });
  }

  private switchWorkspace(workspaceId: number): void {
    $.ajax({
      url: TYPO3.settings.ajaxUrls.workspace_switch,
      type: 'post',
      data: {
        workspaceId: workspaceId,
        pageId: top.fsMod.recentIds.web,
      },
      success: (response: any): void => {
        if (!response.workspaceId) {
          response.workspaceId = 0;
        }

        this.performWorkspaceSwitch(parseInt(response.workspaceId, 10), response.title);

        // append the returned page ID to the current module URL
        if (response.pageId) {
          top.fsMod.recentIds.web = response.pageId;
          let url = TYPO3.Backend.ContentContainer.getUrl();
          url += (!url.includes('?') ? '?' : '&') + '&id=' + response.pageId;
          WorkspacesMenu.refreshPageTree();
          Viewport.ContentContainer.setUrl(url);

          // when in web module reload, otherwise send the user to the web module
        } else if (top.currentModuleLoaded.startsWith('web_')) {
          WorkspacesMenu.refreshPageTree();
          ModuleMenu.App.reloadFrames();
        } else if (TYPO3.configuration.pageModule) {
          ModuleMenu.App.showModule(TYPO3.configuration.pageModule);
        }

        // reload the module menu
        ModuleMenu.App.refreshMenu();
      },
    });
  }
}

const workspacesMenu = new WorkspacesMenu();
// expose the module in a global object
TYPO3.WorkspacesMenu = workspacesMenu;

export = workspacesMenu;
