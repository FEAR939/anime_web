const search_input = document.body.querySelector(".search_input");
const search_results = document.body.querySelector(".search_results");

render_search();

function render_search() {
    search_input.addEventListener("keyup", (event) => {
        if (event.key !== "Enter" || search_input.value.trim().length == 0) return;
        search_results.innerHTML = "<div class='spinner'></div>"
    
        fetch("/cors-fetch", {
            method: "POST",
            body: "POST " + new URLSearchParams({ keyword: search_input.value }) + " https://aniworld.to/ajax/search",
        })
            .then((response) => response.json())
            .then((text) => {
            // parse dom
            
            search_results.innerHTML = ""
            text.forEach((item) => {
                if (!item.link.includes("/anime/stream/")) return;
    
                const search_result = document.createElement("a");
                search_result.className = "search_result";
                search_result.innerHTML = item.title;
                search_result.href = "/watch?v=https://aniworld.to" + item.link;
                search_results.appendChild(search_result);
            });
        });
    });
}