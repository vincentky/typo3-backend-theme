import interact from 'interactjs';
import PersistentStorage from 'TYPO3/CMS/Backend/Storage/Persistent';

enum NavigationType {
    PAGE = 'page',
    LINK_BROWSER = 'linkBrowser',
}

class NavigationContainer {
    constructor() {
        this.initialize();
    }

    private container: HTMLDivElement = null;
    private navigationType: NavigationType = null;

    protected getPageTreeStyles = (width: number) =>
        `.scaffold-content-navigation-expanded .scaffold-content-navigation{width:${width}px} .scaffold-content-navigation-expanded .scaffold-content-module{left:${width}px}`;
    protected getLinkBrowserStyles = (width: number) =>
        `.element-browser .element-browser-main .element-browser-main-sidebar{width:${width}px}`;

    /* getHtmlStyles(width:number):string{

   }*/

    /*protected getLinkBrowserContentWidth = ():number => this.container ? this.container.scrollWidth + 10 : 0;
  protected getPageContentWidth = ():number => {
    const nodeWrapper = document.querySelector('#typo3-pagetree svg g.nodes-wrapper');
    if (nodeWrapper) {
      return nodeWrapper.getBBox().width;
    }
    return 0;
  };*/

    public initialize(): void {
        this.container = <HTMLDivElement>document.querySelector('.scaffold-content-navigation');
        // Web > page

        if (this.container) {
            this.navigationType = NavigationType.PAGE;
        } else {
            this.container = <HTMLDivElement>document.querySelector('.element-browser-main-sidebar');
            if (this.container) {
                this.navigationType = NavigationType.LINK_BROWSER;
            }
        }
      console.log(  this.navigationType)
        if (this.container) {
            interact(this.container).resizable({
                // resize from all edges and corners
                edges: { left: false, right: true, bottom: false, top: false },
                listeners: [
                    {
                        end: (e: InteractEvent) => {
                            const sheetId = this.navigationType;
                            let sheet = document.getElementById(sheetId);
                            if (!sheet) {
                                sheet = document.createElement('style');
                                sheet.id = sheetId;
                                document.body.appendChild(sheet);
                                console.log('create sheet',sheet)
                            }
                            const width = parseInt(e.rect.width);
                            switch (this.navigationType) {
                                case NavigationType.PAGE:
                                    sheet.innerHTML = this.getPageTreeStyles(width);
                                  PersistentStorage.set('BackendComponents.States.Pagetree.width', width);
                                    break;
                                case NavigationType.LINK_BROWSER:
                                    sheet.innerHTML = this.getLinkBrowserStyles(width);
                                  PersistentStorage.set('BackendComponents.States.Pagetree.Browser.width', width);
                                    break;
                                default:
                                    return null;
                                    break;
                            }
                        },

                        move: (e: InteractEvent) => {
                            const target = <HTMLDivElement>e.target;
                            if (target) {
                                target.style.width = e.rect.width + 'px';
                                const nextElement = <HTMLDivElement>target.nextElementSibling;
                                if (nextElement) {
                                    nextElement.style.left = e.rect.width + 'px';
                                }
                            }
                        },
                    },
                ],
                modifiers: [
                    // minimum size
                    interact.modifiers.restrictSize({
                        min: { width: 200 },
                    }),
                ],
            });
        }
    }
}

export = new NavigationContainer();
