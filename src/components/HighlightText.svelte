<script lang="ts">
    export let text;
    export let shouldHighlight = true;
    export let truncateEllipsis = false;
    export let indices: Set<number> = new Set();
</script>

<div class="highlight-text" class:truncateEllipsis={truncateEllipsis}>
    {#each text as char, index}
    <span class="character" class:highlight={shouldHighlight && indices.has(index)}>{char}</span>
    {/each}
</div>

<style lang="scss">
    @import '../colors';
    @import '../containers';

    .highlight-text {
        @include normalize;
        font-size: 16px;
        color: $kh-white;

        &.truncateEllipsis {
            text-overflow: ellipsis;
            white-space: nowrap;
            overflow: hidden;
        }
    }

    .character {
        margin: 0;
        padding: 0;
        &.highlight {
            font-weight: bold;
            color: $kh-pink;
        }
    }

</style>
