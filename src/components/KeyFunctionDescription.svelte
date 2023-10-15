<script lang="ts">
    import K from './Key.svelte';
    export let key: string;
    export let description: string;
</script>

<div class="key-function-info">
    <span class="key">
        <K>{key}</K>
    </span>
    <span class="description">{description}</span>
</div>

<style lang="scss">
    @import '../containers';

    .key-function-info {
        display: flex;
        font-size: 14px;
        padding: 3px 10px;
        justify-content: center;

        .key {
            flex-grow: 0;
        }

        .description {
            margin-left: 10px;
            flex-grow: 1;
        }
    }


</style>
