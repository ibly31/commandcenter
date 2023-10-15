import Popup from '../components/Popup.svelte';

function render() {
    new Popup({
        target: document.body
    });
}

document.addEventListener("DOMContentLoaded", render);
