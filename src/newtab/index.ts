import NewTab from "../components/NewTab.svelte";
import { storage } from "../storage";

import "./styles.css";
import { mount } from "svelte";

function render() {
    const target = document.getElementById("app");

    if (target) {
        storage.get().then(({ count }) => {
            mount(NewTab, {
                            target,
                            props: { count },
                        });
        });
    }
}

document.addEventListener("DOMContentLoaded", render);
