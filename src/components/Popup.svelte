<script lang="ts">
import Readme from './Readme.svelte';

</script>

<Readme />

<style lang="scss">
    @import '../assets/colors';
    @import '../assets/mixins';

    body {
      margin: 0;
      width: 550px;
      height: 600px;
      background-color: #202124;
    }

    .options-container {
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
