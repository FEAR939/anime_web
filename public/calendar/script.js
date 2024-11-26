const schedule_dropdown = document.body.querySelector(".schedule_date");
const schedules_container = document.body.querySelector(
    ".schedules_container",
);

async function renderSchedule() {
    const doc = await get_dom("https://aniworld.to/animekalender");

    const sections = doc.querySelectorAll("section");
    const schedules = [];

    sections.forEach((section, i) => {
        const date = section.querySelector("h3").textContent;
        const option = document.createElement("option");
        option.value = i;
        option.textContent = date;
        schedule_dropdown.appendChild(option);

        const schedule = [];

        const elements = section.querySelectorAll("a");

        elements.forEach((element) => {
            const title = element.querySelector("h3").textContent;
            const stats = element.querySelectorAll("small");
            const image = stats[0].querySelector("img").getAttribute("data-src");
            schedule.push({
                title: title,
                ep: stats[0].textContent.trim(),
                image: image,
                time: stats[1].textContent.trim(),
            });
        });

        schedules.push(schedule);
    });

    var expand_state = false;
    const expand = document.createElement("div");
    expand.className = "expand";

    function renderSchedules(items, length) {
        schedules_container.innerHTML = "";
        items.slice(0, length).forEach((item) => {
        const node = document.createElement("div");
        node.className = "schedule_item";

        const node_title = document.createElement("div");
        node_title.className = "schedule_item_title";
        node_title.textContent = item.title;
        node.appendChild(node_title);

        const node_ep = document.createElement("div");
        node_ep.className = "schedule_item_ep";
        node_ep.textContent = item.ep;
        node.appendChild(node_ep);

        const node_lang = document.createElement("img");
        node_lang.className = "schedule_item_image";
        node_lang.src = "https://aniworld.to" + item.image;
        node.appendChild(node_lang);

        const node_time = document.createElement("div");
        node_time.className = "schedule_item_time";
        node_time.textContent = item.time;
        node.appendChild(node_time);

        schedules_container.appendChild(node);
            expand.textContent = expand_state ? "Collapse" : "Expand";
            schedules_container.appendChild(expand);
        });
    }

    renderSchedules(schedules[0], 5);
    expand.addEventListener("click", () => {
        expand_state = expand_state ? false : true;
        var length = expand_state ? schedules[schedule_dropdown.value].length : 5;
        renderSchedules(schedules[schedule_dropdown.value], length);
    });

    schedule_dropdown.addEventListener("change", () => {
        renderSchedules(schedules[schedule_dropdown.value]);
    });
}

renderSchedule();