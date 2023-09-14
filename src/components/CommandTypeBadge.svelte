<script lang="ts">
    import { CommandType } from '../commands';
    export let type: CommandType;

    let badgeText = {
        [CommandType.BOOKMARK]: 'BOOKMARK',
        [CommandType.CURRENT_TAB]: 'CURRENT',
        [CommandType.RECENT_TAB]: 'CLOSED',
        [CommandType.EXACT]: 'COMMAND'
    }[type];
</script>

<span class="command-type-badge {type}">
    {badgeText}
</span>

<style lang="scss">
    @import '../colors';

    .command-type-badge {
        font-size: 10px;
        min-width: 65px;
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

        &.RECENT_TAB {
            background-color: $kh-silver;
        }

        &.EXACT {
            background-color: transparent;
            color: $kh-green;
        }
    }
</style>
