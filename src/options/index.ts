import Options from "../components/Options.svelte";

function render() {
    new Options({
        target: document.body
    });
}

document.addEventListener("DOMContentLoaded", render);
