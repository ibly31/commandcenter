import CommandCenter from '../components/CommandCenter.svelte';

import './styles.css';

type RenderResult =  () => void;

const CONTAINER_ID = 'commandcenter-container';
function renderCommandCenter(): RenderResult {
    let target = document.getElementById(CONTAINER_ID);
    let commandCenter: CommandCenter;

    function destroy() {
        commandCenter?.$destroy();
        document.body.removeChild(target);
    }

    if (!target) {
        target = document.createElement('div');
        target.id = CONTAINER_ID;
        target.onclick = () => destroy();
        document.body.appendChild(target);
    }
    //
    // chrome.runtime.sendMessage({ textBack: 'qwerqwer' }, res => {
    //     console.log('textBack response: ', res);
    // });

    chrome.runtime.sendMessage({ loadAllCommands: true }, (response) => {
        console.log('3195 got loadRecent response: ', response)
        const bookmarkCommands = response?.bookmarkCommands ?? [];
        const currentTabCommands = response?.currentTabCommands ?? [];
        const recentTabCommands = response?.recentTabCommands ?? [];
        commandCenter = new CommandCenter({
            target,
            props: {
                focusCommandInputRef: true,
                renderingInPage: true,
                bookmarkCommands,
                currentTabCommands,
                recentTabCommands,
                escapeHandler: () => destroy()
            }
        });
        return () => destroy();
    });
}

let commandCenterRenderResult: RenderResult;
type CommandCenterMessage = {
    data: {
        source: 'commandcenter';
        action: 'open' | 'close';
    }
};

window.addEventListener('message', (message: CommandCenterMessage) => {
    if (message?.data?.source === 'commandcenter') {
        if (message.data.action === 'open') {
            commandCenterRenderResult = renderCommandCenter();
        } else if (message.data.action === 'close') {
            commandCenterRenderResult?.();
        }
    }
});
