const search_input = document.body.querySelector(".search_input");
const search_results = document.body.querySelector(".search_results");
const interaction = document.body.querySelector(".interaction");

const cookie = localStorage.getItem("cookie");
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

window.onload = () => render_search();

function render_search() {
    search_input.addEventListener("keyup", (event) => {
        if (event.key !== "Enter" || search_input.value.trim().length == 0) return;
    
        fetch("/cors-fetch", {
            method: "POST",
            body: "POST " + new URLSearchParams({ keyword: search_input.value }) + " https://aniworld.to/ajax/search",
        })
            .then((response) => response.json())
            .then((text) => {
            // parse dom
    
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