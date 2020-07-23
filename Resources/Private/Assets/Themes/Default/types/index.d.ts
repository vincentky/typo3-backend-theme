/* tslint:disable:max-classes-per-file */

/**
 * Currently a mixture between namespace and global object
 * Add types as you use them
 */
declare namespace TYPO3 {
    export let Notification: any;
    export let settings: any;
    export let langue: any;
    export let Backend: any;
}

// type definition for global namespace object
interface Window {
    TYPO3: any;
    $: any; // only required in ImageManipulation.ts
    startInModule: Array<string>;
    loadEditId: (id: number, addGetVars?: string) => void;
    require: Function;
    list_frame: Window;
    jump: Function;
    currentSubScript: string;
    currentModuleLoaded: string;
    fsMod: { [key: string]: any };
    nextLoadModuleUrl: string;

    // required for Paste.ts
    // TODO these should be passed as data attributes
    pasteAfterLinkTemplate: string;
    pasteIntoLinkTemplate: string;
}

interface JQueryTypedEvent<T extends Event> extends Event {
    originalEvent: T;
}

/**
 * Required to make jQuery plugins "available" in TypeScript
 */
interface JQuery {
    dataTableExt: any;

    search(term?: string): JQuery;

    draw(): JQuery;

    datetimepicker(options?: any): JQuery;

    dragUploader(options?: any): JQuery;

    t3FormEngineFlexFormElement(options?: any): JQuery;

    // To be able to use twbs/bootstrap-slider we have to override the definition of jquerui
    slider(options: { [key: string]: any }): any;

    // To be able to use jquery/autocomplete-slider we have to override the definition of jquerui
    autocomplete(options?: { [key: string]: any }): any;
    disablePagingAction(): void;
}
