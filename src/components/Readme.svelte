<script lang="ts">
    import KeyFunctionDescription from './KeyFunctionDescription.svelte';
    import K from './Key.svelte';
    import { G_DOUBLE_TIME, G_KEY_MAP, KEY_MAP, type KeyMap } from '../content/vimKeys';

    type KeyFunctionInfo = {
        key: string;
        description: string;
    }

    function getKeyFunctionInfos(keyMap: KeyMap): KeyFunctionInfo[] {
        return Object.keys(keyMap).map((key: string) => {
            const [description] = [...keyMap[key]()];
            return { key, description };
        });
    }

    const gKeyFunctionInfos = getKeyFunctionInfos(G_KEY_MAP);
    const keyFunctionInfos = getKeyFunctionInfos(KEY_MAP);
</script>

<div class="readme-container">
    <p>CommandCenter is a utility for adding the following functionality:</p>
    <div class="li">"Fuzzy search" that uses <K>fzf</K> that is more forgiving and uses substring search</div>
    <div class="li">CommandCenter: list of commands, bookmarks, current and recently closed tabs</div>
    <div class="li">TabCenter: allows you to search, jump to, close and reopen tabs</div>
    <div class="li">Keybindings to open both of these on any page, not just New Tab</div>
    <div class="li">Utility "Site Scripts" injected into configured webpages</div>
    <div class="li">Vim-style keybindings to every webpage</div>
    <h2>Command and Tab Center</h2>
    <p>
        Be sure to select "keep" when presented with the option when opening New Tab page for the first time
        Look at the G Key Bindings below to see how to access on any page, not just New Tab
        To use TabCenter, use the <K>tc</K> command or search for it and hit <K>enter</K>
    </p>
    <h2>Keybindings</h2>
    <p>Keybindings follow general Vim style</p>
    {#each keyFunctionInfos as kfi}
        <KeyFunctionDescription key={kfi.key} description={kfi.description} />
    {/each}
    <h2>G Keybindings</h2>
    <p>
        "G Keybindings" always are prefixed with lowercase <K>g</K>
        You must hit the second key within {G_DOUBLE_TIME} milliseconds.
        Most have a mnemonic to help memorize. <K>gg</K> and <K>G</K>
    </p>
    {#each gKeyFunctionInfos as gkfi}
        <KeyFunctionDescription key={`g${gkfi.key}`} description={gkfi.description} />
    {/each}
</div>

<style lang="scss">
  @import '../colors';
  @import '../containers';

  .readme-container {
    width: 100%;
    display: flex;
    flex-direction: column;
  }

  .li {
    margin: 3px;

    &:before {
      content: "•  "
    }
  }

  h2 {
    @include border-hr;
    text-align: center;
    margin: 15px 0 5px;
  }

  p {
    font-size: 15px;
    padding: 0 10px;
    margin: 10px 0;
  }
</style>
