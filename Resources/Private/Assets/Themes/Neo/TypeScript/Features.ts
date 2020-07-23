import Notification from 'TYPO3/CMS/Backend/Notification';

/**
 * Module: Starfishprime/Templates/Features
 * @exports Starfishprime/Templates/Features
 */
class Features {
    private selectorSaveTrigger = '.t3js-features-save';
    private currentModal: HTMLElement;

    constructor() {
        this.initialize();
    }

    initialize(): void {
        fetch(TYPO3.settings.ajaxUrls['ext-templates-features'], {
            method: 'POST',
            body: null,
        })
            .then((response: Response) => {
                if (!response.ok) {
                    throw new Error(response.statusText);
                }
                return response.text();
            })
            .catch((error: Error) => {
                Notification.error(error);
            });
    }

    /*public initialize(currentModal: HTMLElement): void {
    this.currentModal = currentModal;
    this.getContent();
    const featuresSave = currentModal.querySelector('.t3js-features-save');
    if (featuresSave) {
      featuresSave.addEventlistener('click', (e: KeyboardEvent): void => {
        e.preventDefault();
        this.save();
      });
    }

  }*/
}

export = new Features();
