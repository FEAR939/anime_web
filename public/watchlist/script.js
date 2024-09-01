const cookie = localStorage.getItem("cookie");
const anime_cards = document.querySelector(".anime_cards");
const interaction = document.body.querySelector(".interaction");

if (!cookie) {
    const login = document.createElement("a");
    login.className = "login";
    login.textContent = "Login";
    login.href = "/login";
    interaction.appendChild(login);
} else {
    fetch("/get-avatar", {
        headers: {
            'Authorization': cookie,
        }
    }).then(response => response.json()).then(text => {
        const account = document.createElement("div");
        account.className = "account";
        interaction.appendChild(account);

        const avatar = document.createElement("img");
        avatar.className = "user_avatar";
        avatar.src = text.avatar;
        account.appendChild(avatar);

        const account_panel = document.createElement("div");
        account_panel.className = "account_panel";
        account.appendChild(account_panel);

        avatar.onclick = () => {
            switch(window.getComputedStyle(account_panel, null).display) {
                case "none": {
                    account_panel.style.display = "flex";
                    break;
                }
                case "flex": {
                    account_panel.style.display = "none";
                    break;
                }
            }
        }

        const watchlist_btn = document.createElement("a");
        watchlist_btn.className = "watchlist_btn";
        watchlist_btn.textContent = "Your Watchlist";
        watchlist_btn.href = "/watchlist";
        account_panel.appendChild(watchlist_btn);

        const change_avatar = document.createElement("a");
        change_avatar.className = "change_avatar";
        change_avatar.textContent = "Change Avatar";
        change_avatar.href = "/avatar";
        account_panel.appendChild(change_avatar);

        const dashboard_btn = document.createElement("a");
        dashboard_btn.className = "dashboard_btn";
        dashboard_btn.textContent = "Dashboard";
        dashboard_btn.href = "/dashboard";
        account_panel.appendChild(dashboard_btn);

        const logout_btn = document.createElement("div");
        logout_btn.className = "logout_btn";
        logout_btn.textContent = "Logout";
        account_panel.appendChild(logout_btn);

        logout_btn.onclick = () => {
            localStorage.removeItem("cookie");
            window.location.reload();
        }
    });
}

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

async function get_dom(url) {
    try {
        const response = await fetch("/cors-fetch", { method: "POST", body: "GET " + url });
        const text = await response.text();
        const parser = new DOMParser();
        const dom = parser.parseFromString(text, "text/html");
    
        return dom;
    } catch (error) {
        console.error("Error fetching DOM:", error);
        throw error;
    }
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