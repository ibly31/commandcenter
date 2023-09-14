import NewTab from "../components/NewTab.svelte";
import { storage } from "../storage";

import "./styles.css";

function render() {
    const target = document.getElementById("app");

    if (target) {
        storage.get().then(({ count }) => {
            new NewTab({
                target,
                props: { count },
            });
        });
    }
}

document.addEventListener("DOMContentLoaded", render);
