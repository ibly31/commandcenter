import CommandCenter from '../components/CommandCenter.svelte';
import TabCenter from '../components/TabCenter.svelte';

import './styles.css';

type RenderResult =  () => void;

const CONTAINER_ID = 'commandcenter-container';
function createContainer(destroy: RenderResult): HTMLElement {
    getContainer()?.remove();
    const target = document.createElement('div');
    target.id = CONTAINER_ID;
    target.onclick = () => destroy();
    document.body.appendChild(target);
    return target;
}

function getContainer() {
    return document.getElementById(CONTAINER_ID);
}

function removeContainer() {
    const container = getContainer();
    if (container) {
        document.body.removeChild(container);
    }
}

function renderCommandCenter(): RenderResult {
    const target = createContainer(destroy);
    let commandCenter: CommandCenter;

    function destroy() {
        commandCenter?.$destroy();
        removeContainer();
    }

    commandCenter = new CommandCenter({
        target,
        props: {
            focusInputRef: true,
            renderingInPage: true,
            escapeHandler: () => destroy(),
            switchModeHandler: () => {
                window.postMessage({ source: 'commandcenter', action: 'open-tabcenter' });
            }
        }
    });
    return () => destroy();
}

function renderTabCenter(): RenderResult {
    const target = createContainer(destroy);
    let tabCenter: TabCenter;

    function destroy() {
        tabCenter?.$destroy();
        removeContainer();
    }

    tabCenter = new TabCenter({
        target,
        props: {
            focusInputRef: true,
            renderingInPage: true,
            escapeHandler: () => destroy(),
            switchModeHandler: () => destroy()
        }
    });
    return () => destroy();
}

let currentRenderResult: RenderResult;
type CommandCenterMessage = {
    data: {
        source: 'commandcenter';
        action: 'open' | 'open-tabcenter' | 'close';
    }
};

window.addEventListener('message', (message: CommandCenterMessage) => {
    if (message?.data?.source === 'commandcenter') {
        if (message.data.action === 'open') {
            currentRenderResult = renderCommandCenter();
        } else if (message.data.action === 'open-tabcenter') {
            currentRenderResult = renderTabCenter();
        } else if (message.data.action === 'close') {
            currentRenderResult?.();
        }
    }
});
