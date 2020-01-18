import Notification from 'TYPO3/CMS/Backend/Notification';

/**
 * Module: Starfishprime/Templates/IconsSearch
 * @exports Starfishprime/Templates/IconsSearch
 */
class IconsManager {

  constructor() {
    this.initialize();
  }

  initialize(): void {
    const searchField = document.querySelector<HTMLInputElement>('#search-field');
    const filtersButton = document.querySelectorAll<HTMLButtonElement>('.t3js-filter-buttons button');
    const btnIcons = document.querySelectorAll<HTMLLinkElement>('.feature-icons-container .btn');
    const allIcons: NodeListOf<HTMLDivElement> = document.querySelectorAll<HTMLDivElement>(
      '#t3js-filter-container [data-icon-identifier]',
    );
    const allBitmapImages: NodeListOf<HTMLImageElement> = document.querySelectorAll<HTMLImageElement>(
      '#t3js-filter-container img:not([src$=".svg"])',
    );
    const allSvg: NodeListOf<HTMLImageElement> = document.querySelectorAll<HTMLImageElement>(
      '#t3js-filter-container img[src$=".svg"]',
    );
    const allFontIcons: NodeListOf<HTMLElement> = document.querySelectorAll<HTMLElement>(
      '#t3js-filter-container i.fa',
    );
    for (let i = 0; i < btnIcons.length; i++) {
      const inputFile = btnIcons[i].querySelector<HTMLInputElement>('.feature-icons-container-upload');

      if (inputFile) {
        btnIcons[i].addEventListener('click', (e: Event) => {
          e.stopPropagation();
          inputFile.click();
        });
        inputFile.addEventListener('change', (e: Event) => {

          const files = btnIcons[i].files || [];
          const formData = new FormData();
          for (let j = 0; j < files.length; j++) {
            const file = files[j];
            // Check the file type.
            if (!file.type.match('image.*')) {
              alert('Please choose an image');
              continue;
            }

            // Add the file to the request.
            formData.append('icon[]', file, file.name);
            formData.append('identifier', <string>inputFile.dataset.icon);
          }

          const response = fetch(TYPO3.settings.ajaxUrls['ext-templates-upload-icon'], {
            method: 'POST',
            body: formData,
          })
            .then((response: Response) => {
              if (!response.ok) {
                throw new Error(response.statusText)
              }
              return response.text();
            })
            .then((icon: string) => {
              const container = inputFile.closest<HTMLDivElement>(
                '.feature-icons-container',
              );
              if (container) {
                const iconContainer = container.querySelector<HTMLSpanElement>('.feature-icons-container-icon');
                if (iconContainer) {
                  iconContainer.innerHTML = icon;
                }
              }
            })
            .catch((error: Error) => {
              Notification.error(error);
            });
        });
      }
    }
    for (let i = 0; i < filtersButton.length; i++) {
      filtersButton[i].addEventListener('click', (e: MouseEvent) => {
        e.preventDefault();
        if (searchField !== null) {
          const filter = filtersButton[i].dataset.filter || '';
          searchField.value = filter;
          const event = new CustomEvent('keyup', {detail: filter});
          searchField.dispatchEvent(event);
        }
      });
    }
    if (searchField !== null) {
      searchField.addEventListener('keyup', (e: KeyboardEvent) => {
        const typedQuery = searchField.value;
        console.log(typedQuery)
        if (typedQuery === '') {
          for (let i = 0; i < allIcons.length; i++) {
            allIcons[i].style.display = 'block';
          }
        } else {
          if (typedQuery.indexOf('type:') !== -1) {
            const parts = typedQuery.split(':');
            const type = parts[1];
            switch (type.toLowerCase()) {
              case 'bitmap':
                for (let i = 0; i < allIcons.length; i++) {
                  allIcons[i].style.display = 'none';
                }
                for (let i = 0; i < allBitmapImages.length; i++) {
                  if (allBitmapImages[i]) {
                    const icon = allBitmapImages[i].closest<HTMLDivElement>(
                      '[data-icon-identifier]',
                    );
                    if (icon) {
                      icon.style.display = 'block';
                    }
                  }
                }
                break;
              case 'font':
                for (let i = 0; i < allIcons.length; i++) {
                  allIcons[i].style.display = 'none';
                }
                for (let i = 0; i < allFontIcons.length; i++) {
                  if (allFontIcons[i]) {
                    const icon = allFontIcons[i].closest<HTMLDivElement>('[data-icon-identifier]');
                    if (icon) {
                      icon.style.display = 'block';
                    }
                  }
                }
                break;
              case 'vector':
                for (let i = 0; i < allIcons.length; i++) {
                  allIcons[i].style.display = 'none';
                }
                for (let i = 0; i < allSvg.length; i++) {
                  if (allSvg[i]) {
                    const icon = allSvg[i].closest<HTMLDivElement>('[data-icon-identifier]');
                    if (icon) {
                      icon.style.display = 'block';
                    }
                  }
                }
                break;
            }
          } else {
            let f = 0;
            let z = 0;
            for (let i = 0; i < allIcons.length; i++) {
              const identifier = allIcons[i].dataset.iconIdentifier || '';
              if (identifier.includes(typedQuery)) {
                f++;
              } else {
                z++;
              }
              allIcons[i].style.display = identifier.includes(typedQuery) ? 'block' : 'none';
            }
            console.log(f, z)
          }
        }
      });
    }
  }
}

// create an instance and return it
export = new IconsManager();
