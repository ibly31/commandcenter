import Popup from '../components/Popup.svelte';
import { mount } from "svelte";

function render() {
    mount(Popup, {
            target: document.body
        });
}

document.addEventListener("DOMContentLoaded", render);
