const cookie = localStorage.getItem("cookie");
const anime_cards = document.querySelector(".anime_cards");
const interaction = document.body.querySelector(".interaction");

menu(interaction);

var marked;

if (cookie) {
    fetch("/get-marked", {
        method: "GET",
        headers: {
            "Authorization": cookie
        }
    }).then(response => response.json()).then(text => {
        marked = JSON.parse(text.marked);
        render_watchlist();
    });
}

function render_watchlist() {
    if (marked.length == 0) return anime_cards.textContent = "Your Watchlist is empty";

    marked.map(anime => {
        get_dom(anime).then(DOM => {
            const redirect = anime;
            const image = DOM.querySelector(".seriesCoverBox img").getAttribute("data-src");
            const title = DOM.querySelector(".series-title h1").textContent;

            const home_card = document.createElement("div");
            home_card.className = "home_card";

            const home_card_image = document.createElement("img");
            home_card_image.className = "home_card_image";
            home_card_image.src = "https://aniworld.to" + image;
            home_card.appendChild(home_card_image);

            const home_card_title = document.createElement("div");
            home_card_title.className = "home_card_title";
            home_card_title.textContent = title;
            home_card.appendChild(home_card_title);
        

            home_card.onclick = () => {
                window.location.replace("/watch?v=" + redirect);
            }

            anime_cards.appendChild(home_card);
        });
    });
}