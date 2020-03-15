import * as $ from 'jquery';
import interact from 'interactjs'
import PersistentStorage from 'TYPO3/CMS/Backend/Storage/Persistent';

enum NavigationType {
  PAGE = 'page',
  LINK_BROWSER = 'linkBrowser'
}


export class NavigationContainer {
  constructor() {
    this.initialize();
  }

  private container: HTMLDivElement = null;
  private navigationType: NavigationContainer = null;

  protected iframeOverlay(area:?HTMLElement) {
    if (area){
      const ifr = area.querySelector('iframe');
      if (ifr){
        const d =  document.createElement('div');
        d.style.position = 'absolute';
        d.style.top = ifr.offsetTop;
        d.style.left = 0;
        d.style.width = '100%';
        d.style.height = ifr.offsetHeight + 'px';
        area.append(d);
      }
    }


  }

  protected getStdStyles = (width: number) => `<style>.scaffold-content-navigation-expanded .scaffold-content-navigation{width:${width}px} .scaffold-content-navigation-expanded .scaffold-content-module{left:${width}px}</style>`
  protected getLinkBrowserStyles = (width: number) => `<style>.element-browser .element-browser-main .element-browser-main-sidebar{width:${width}px}</style>`;

 /* getHtmlStyles(width:number):string{

  }*/

  protected getLinkBrowserContentWidth = ():number => this.container ? this.container.scrollWidth + 10 : 0;
  protected getPageContentWidth = ():number => {
    const nodeWrapper = document.querySelector('#typo3-pagetree svg g.nodes-wrapper');
    if (nodeWrapper) {
      return nodeWrapper.getBBox().width;
    }
    return null;
  };

  protected getContentWidth() {

    switch (this.navigationType){
      case NavigationType.PAGE:
      return this.getPageContentWidth();
      break;
      case NavigationType.LINK_BROWSER:
       return this.getLinkBrowserContentWidth();
      break;
    }
  return null;
    }

  public initialize(): void {
    this.container = <HTMLDivElement>document.querySelector('.scaffold-content-navigation');
    // Web > page
    if (this.container) {
      this.navigationType = NavigationType.PAGE;
    } else {
      this.container = document.querySelector('.element-browser-main-sidebar');
      if (this.container) {
        this.navigationType = NavigationType.LINK_BROWSER;
      }
    }

    if (this.container) {
      interact(this.container)
        .resizable({
          // resize from all edges and corners
          edges: { left: false, right: true, bottom: false, top: false },

          listeners: {
            move (event) {
              const target = event.target
              const x = (parseFloat(target.getAttribute('data-x')) || 0)
              const y = (parseFloat(target.getAttribute('data-y')) || 0)

              // update the element's style
              target.style.width = event.rect.width + 'px'
              target.style.height = event.rect.height + 'px'

              // translate when resizing from top or left edges
              x += event.deltaRect.left
              y += event.deltaRect.top

              target.style.webkitTransform = target.style.transform =
                'translate(' + x + 'px,' + y + 'px)'

              target.setAttribute('data-x', x)
              target.setAttribute('data-y', y)
              target.textContent = Math.round(event.rect.width) + '\u00D7' + Math.round(event.rect.height)
            }
          },
          modifiers: [
            // keep the edges inside the parent
            interact.modifiers.restrictEdges({
              outer: 'parent'
            }),

            // minimum size
            interact.modifiers.restrictSize({
              min: { width: 200 }
            })
          ],

          inertia: true
        })
        .draggable({
          listeners: { move: window.dragMoveListener },
          inertia: true,
          modifiers: [
            interact.modifiers.restrictRect({
              restriction: 'parent',
              endOnly: true
            })
          ]
        })
    }

  }

}

export = new NavigationContainer();
