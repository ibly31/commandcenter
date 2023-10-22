import { KeyMap, makeKeyFunction } from '../vimKeys';
import { siteScript, SiteScript } from '../siteScripts';

export const LOCAL_G_KEY_MAP: KeyMap = {
    // ...makeKeyFunction('single character key here', 'Custom G key function', () => {
    //     console.log('Running custom G key function')
    // }),
}

export const LOCAL_KEY_MAP: KeyMap = {};
export const LOCAL_SITE_SCRIPTS: SiteScript[] = [
    // siteScript('example.com', 'Improve example.com', () => {
    //     console.log('Improving example.com');
    // })
];