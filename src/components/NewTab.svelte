<script lang="ts">
    import CommandCenter from './CommandCenter.svelte';
    import TabCenter from './TabCenter.svelte';
    import { Mode } from '../comms/commands';

    let focusInputRef = false;

    let mode = Mode.COMMAND_CENTER;

    function togglefocusInputRef() {
        focusInputRef = true;
        setTimeout(() => {
            focusInputRef = false;
        }, 10);
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="container" on:click={() => togglefocusInputRef()}>
    {#if mode === Mode.TAB_CENTER}
        <TabCenter
                largeWidth
                escapeHandler={() => mode = Mode.COMMAND_CENTER}
                {focusInputRef}
                renderingInPage={false}
        />
    {:else}
        <CommandCenter
                largeWidth
                escapeHandler={() => {}}
                switchModeHandler={(switchToMode) => mode = switchToMode}
                renderingInPage={false}
                {focusInputRef}
        />
    {/if}
</div>

<style lang="scss">
    @import '../assets/colors';

    .container {
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: $kh-black;
        height: 100vh;
    }
</style>
