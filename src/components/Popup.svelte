<script lang="ts">
import Readme from './Readme.svelte';

</script>

<div class="popup-container">
    <h1>CommandCenter</h1>
    <Readme />
</div>

<style lang="scss">
    @import '../colors.scss';
    @import '../containers.scss';

    .popup-container {
        @include system-font;
        color: $kh-light;
        padding: 0 15px 50px 15px;

        display: flex;
        flex-direction: column;
    }

    h1 {
        @include border-hr;
        text-align: center;
        margin-bottom: 5px;
    }

</style>
