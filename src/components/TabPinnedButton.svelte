<script lang="ts">
    export let onClick: () => void;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<span class="pinned-button" on:click={() => onClick()}>
    🔒
</span>

<style lang="scss">
    @import '../colors';

    $size: 24px;

    .pinned-button {
        position: absolute;
        right: calc($size / 2);
        width: $size;
        height: $size;
        opacity: 0.75;
        cursor: pointer;
        font-size: $size;
        text-align: center;
    }
</style>
