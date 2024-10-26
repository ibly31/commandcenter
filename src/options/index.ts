import Options from "../components/Options.svelte";
import { mount } from "svelte";

function render() {
    mount(Options, {
            target: document.body
        });
}

document.addEventListener("DOMContentLoaded", render);
