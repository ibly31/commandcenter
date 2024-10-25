import CommandCenter from '../components/CommandCenter.svelte';
import TabCenter from '../components/TabCenter.svelte';

import './styles.css';
import { Action, Msg, postActionMessage, Source } from '../comms/messages';
import { mount } from "svelte";

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

    commandCenter = mount(CommandCenter, {
            target,
            props: {
                focusInputRef: true,
                renderingInPage: true,
                escapeHandler: () => destroy(),
                switchModeHandler: () => {
                    postActionMessage(Action.close);
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

    tabCenter = mount(TabCenter, {
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
        source: keyof typeof Source;
        action: keyof typeof Action;
    }
};

window.addEventListener('message', (message: CommandCenterMessage) => {
    if (message?.data?.source === Source.CommandCenter) {
        if (message.data.action === Action.openCommandCenter) {
            currentRenderResult = renderCommandCenter();
        } else if (message.data.action === Action.openTabCenter) {
            currentRenderResult = renderTabCenter();
        } else if (message.data.action === Action.close) {
            currentRenderResult?.();
        }
    }
});
