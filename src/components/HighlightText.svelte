<script lang="ts">
    export let text;
    export let shouldHighlight;
    export let indices: Set<number> = new Set();
</script>

<div class="highlight-text">
    {#each text as char, index}
    <span class="character" class:highlight={shouldHighlight && indices.has(index)}>{char}</span>
    {/each}
</div>

<style lang="scss">
    @import '../colors';

    .highlight-text {
        font-size: 1rem;
        color: $kh-white;
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
