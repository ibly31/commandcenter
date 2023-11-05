<script lang="ts">
    export let small = false;

    const lineHeight = small ? 11 : 15;
    const height = small ? 10 : 15;
</script>

<code style="line-height: {lineHeight}px; height: {height}px">
    <slot />
</code>

<style lang="scss">
    @import '../assets/colors';

    code {
        display: inline-block;
        white-space: pre-wrap;
        font-family: monospace;
        padding: 2px 4px;
        background-color: $kh-light;
        border-radius: 4px;
        color: black;
    }

</style>
