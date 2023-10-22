export type ContentUrls = string | string[];
export function urlIncludes(urls: ContentUrls | undefined) {
    if (!urls || !urls?.length) {
        return true;
    }
    if (!Array.isArray(urls)) {
        urls = [urls];
    }
    return urls.some(url => document.location.href.includes(url));
}

 /** Some elements aren't rendered on page load so we need to retry periodically
  *  TODO: Maybe use MutationObserver to run when page changes
  */
export function retryAction(retrySeconds: number, interval: number, action: () => boolean) {
    function tryAction() {
        retrySeconds = retrySeconds - interval / 1000.0;
        if (retrySeconds <= 0) {
            return;
        }
        if (action()) {
            return;
        }
        window.setTimeout(tryAction, interval);
    }

    window.setTimeout(tryAction, interval);
}

/** Make the TypeScript aspect of querySelector more readable */
export function queryEach<ElementType extends Element>(selector: string, each: (element: ElementType) => void) {
    document.querySelectorAll<ElementType>(selector).forEach(each);
}

/** We queryEach on <a> tags quite a bit, let's make it even easier */
export function queryEachAnchor(selector: string, each: (element: HTMLAnchorElement) => void) {
    queryEach<HTMLAnchorElement>(selector, each);
}

export function triggerPageOffset(offset: number) {
    const url = location.href;

    const numbers = url.match(/(\d+)/g);
    if (!numbers) {
        console.log('Tried to trigger page offset, no numbers found');
        return;
    }
    const lastNumber = numbers.slice(-1)[0];
    const index = url.lastIndexOf(lastNumber);
    if (index === -1) {
        console.log(`Unable to find ${lastNumber} in ${url}`);
        return;
    }

    const offsetNumber = (Number(lastNumber) + offset).toString();
    location.href = url.substring(0, index) + offsetNumber + url.substring(index + offsetNumber.length);
}

export function reloadPage() {
    window.location.reload();
}

export function openNewTab(url: string) {
    window.open(url, '_blank');
}

export function scrollTo(to: 'top' | 'bottom', behavior: ScrollBehavior) {
    const top = to === 'top' ? 0 : document.body.scrollHeight;
    window.scrollTo({ top, behavior });
}

const INPUT_ELEMENTS = ['input', 'textarea', 'button'];
const INPUT_ROLES = ['textbox', 'textarea', 'input', 'button'];

/** Don't run vim keybindings if we are actively focused on an input element */
export function isFocusedOnInput() {
    const active = document.activeElement;
    if (!active) {
        return false;
    }
    if (INPUT_ELEMENTS.includes(active.tagName.toLowerCase())) {
        return true;
    }
    return INPUT_ROLES.includes(active.getAttribute('role')!);
}
