<script lang="ts">
    import { CommandType, COMMAND_TYPE_LABELS } from '../commands';
    export let type: CommandType;

</script>

<span class="command-type-badge {type}">
    {COMMAND_TYPE_LABELS[type]}
</span>

<style lang="scss">
    @import '../colors';

    .command-type-badge {
        font-size: 12px;
        font-weight: bold;
        text-transform: uppercase;
        min-width: 80px;
        color: $kh-white;
        padding: 3px 0;
        border-radius: 4px;
        text-align: center;

        &.BOOKMARK {
            background-color: $kh-pink;
        }

        &.CURRENT_TAB {
            background-color: $kh-green;
            color: $kh-blue;
        }

        &.CLOSED_TAB {
            background-color: $kh-silver;
        }

        &.EXACT {
            background-color: transparent;
            color: $kh-green;
        }
    }
</style>
