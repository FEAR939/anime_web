const cookie = localStorage.getItem("cookie");
const anime_cards = document.querySelector(".anime_cards");

var marked = [];

if (cookie) {
    fetch("/get-list", {
        method: "GET",
        headers: {
            "Authorization": cookie
        }
    }).then(response => response.json()).then(text => {
        try {
            marked = text;
            console.log(marked);
        } catch (e) {
            console.log(e);
        } finally {
            render_watchlist();
        }
    });
}

function render_watchlist() {
    document.body.querySelector(".spinner").remove();
    if (!marked.length) return anime_cards.textContent = "Your Watchlist is empty";

    marked.map(anime => {
        console.log(anime);
        const home_card = document.createElement("div");
        home_card.className = "home_card";

        const home_card_image = document.createElement("img");
        home_card_image.className = "home_card_image";
        home_card_image.loading = "lazy";
        
        home_card.appendChild(home_card_image);

        const home_card_title = document.createElement("div");
        home_card_title.className = "home_card_title";
        home_card_title.innerHTML = "<div class='skeleton'></div>";
        home_card.appendChild(home_card_title);

        anime_cards.appendChild(home_card);

        get_dom("https://aniworld.to" + anime.series_id).then(DOM => {
            const redirect = anime.series_id;
            const image = DOM.querySelector(".seriesCoverBox img").getAttribute("data-src");
            const title = DOM.querySelector(".series-title h1").textContent;

            home_card_image.src = "https://aniworld.to" + image;
            home_card_title.innerHTML = title;

            home_card.onclick = () => {
                window.location.replace("/watch?v=" + redirect);
            }
        });
    });
}