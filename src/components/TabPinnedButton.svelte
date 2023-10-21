<script lang="ts">
    export let onClick: () => void;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<span class="pinned-button" on:click={() => onClick()}>
    🔒
</span>

<style lang="scss">
    @import '../assets/colors';

    $size: 24px;

    .pinned-button {
        display: inline-block;
        opacity: 0.75;
        cursor: pointer;
        font-size: $size;
        line-height: $size;

        &:hover {
            opacity: 1;
        }
    }
</style>
