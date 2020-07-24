namespace TYPO3 {
  export class Preview {
    private readonly dateField: HTMLInputElement = null;
    private readonly timeField: HTMLInputElement = null;
    private readonly targetField: HTMLInputElement = null;

<<<<<<< ours
=======
    /**
     * Initialize date and time fields of preview
     *
     * PHP / backend side always uses UTC timestamps (for generating time based previews and access time checks)
     * Date and Time fields are HTML5 input fields, combined they update the "targetfield" always containing a PHP
     * compatible (seconds-based) timestamp
     */
>>>>>>> theirs
    constructor() {
      this.dateField = <HTMLInputElement>document.getElementById('preview_simulateDate-date-hr');
      this.timeField = <HTMLInputElement>document.getElementById('preview_simulateDate-time-hr');
      this.targetField = <HTMLInputElement>document.getElementById(this.dateField.dataset.target);

      if (this.targetField.value) {
<<<<<<< ours
        const cd = new Date(this.targetField.value);
        this.dateField.value =
          cd.getFullYear() + '-' + ((cd.getMonth() + 1) < 10 ? '0' : '')
          + (cd.getMonth() + 1) + '-' + (cd.getDate() < 10 ? '0' : '') + cd.getDate();
        this.timeField.value =
          (cd.getHours() < 10 ? '0' : '') + cd.getHours() + ':'
          + (cd.getMinutes() < 10 ? '0' : '') + cd.getMinutes();
=======
        const initialDate = new Date(parseInt(this.targetField.value, 10) * 1000);
        this.dateField.valueAsDate = initialDate;
        this.timeField.valueAsDate = initialDate;
>>>>>>> theirs
      }

      this.dateField.addEventListener('change', this.updateDateField);
      this.timeField.addEventListener('change', this.updateDateField);
    }

    private updateDateField = (): void => {
      let dateVal = this.dateField.value;
      let timeVal = this.timeField.value;
      if (!dateVal && timeVal) {
        let tempDate = new Date();
        dateVal = tempDate.getFullYear() + '-' + (tempDate.getMonth() + 1) + '-' + tempDate.getDate();
      }
      if (dateVal && !timeVal) {
        timeVal =  '00:00';
      }

      if (!dateVal && !timeVal) {
        this.targetField.value = '';
      } else {
        const stringDate = dateVal + ' ' + timeVal;
        const date = new Date(stringDate);

<<<<<<< ours
        this.targetField.value = date.toISOString();
=======
        this.targetField.value = (date.valueOf() / 1000).toString();
>>>>>>> theirs
      }
    }
  }
}

((): void => {
  window.addEventListener(
    'load',
    () => new TYPO3.Preview(),
    false,
  );
})();
