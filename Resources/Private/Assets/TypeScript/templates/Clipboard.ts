import PersistentStorage from 'TYPO3/CMS/Backend/Storage/Persistent';

/**
 * Module: Starfishprime/Templates/Clipboard
 * @exports Starfishprime/Templates/Clipboard
 */
class Clipboard {
  private clipboardContainer: HTMLDivElement;

  constructor() {
    this.initialize();
  }

  isPersistedOpen(): boolean {
    if (!PersistentStorage.isset('clipboardOpen')) {
      return false;
    }
    return <boolean>JSON.parse(PersistentStorage.get('clipboardOpen'));
  }

  initialize(): void {
    const clipboardToggle = document.querySelector<HTMLLinkElement>('a[name="clip_head"]');
    if (clipboardToggle) {
      this.clipboardContainer = <HTMLDivElement>clipboardToggle.closest('.db_list-dashboard');
      if (this.clipboardContainer) {
        if (this.isPersistedOpen()) {
          this.clipboardContainer.classList.add('open');
        }
        clipboardToggle.addEventListener('click', (e: MouseEvent) => {
          e.stopPropagation();
          this.toggleClipboard();
        });

        window.addEventListener('click', (e: MouseEvent) => {
          if (!this.clipboardContainer.contains(<Node>e.target) && this.clipboardContainer.classList.contains('open')) {
            this.closeClipboard();
          }
        });
      }
    }
  }

  closeClipboard(): void {
    this.clipboardContainer.classList.remove('open');
    PersistentStorage.set('clipboardOpen', false);
  }

  toggleClipboard(): void {
    this.clipboardContainer.classList.toggle('open');
    PersistentStorage.set('clipboardOpen', this.clipboardContainer.classList.contains('open'))
  }
}

// create an instance and return it
export = new Clipboard();
