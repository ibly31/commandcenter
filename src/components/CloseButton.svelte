<script lang="ts">
    export let onClick: () => void;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<span class="close-button" on:click={() => onClick()} />

<style lang="scss">
    @import '../assets/colors';

    $size: 24px;
    $half-size: calc($size / 2);

    .close-button {
        position: absolute;
        right: $half-size;
        width: $size;
        height: $size;
        opacity: 0.75;
        cursor: pointer;

        &:hover {
            opacity: 1;
        }
        &:before, &:after {
            position: absolute;
            left: $half-size;
            content: ' ';
            height: $size;
            width: 2px;
            background-color: $kh-white;
        }
        &:before {
            transform: rotate(45deg);
        }
        &:after {
            transform: rotate(-45deg);
        }
    }
</style>
