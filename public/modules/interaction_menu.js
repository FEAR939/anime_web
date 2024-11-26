function menu() {
  const menu_bar = document.createElement("div");
  menu_bar.className = "menu_bar";
  document.body.appendChild(menu_bar);

  const interaction = document.createElement("div");
  interaction.className = "interaction";
  menu_bar.appendChild(interaction);

  const home_item = document.createElement("a");
  home_item.href = "/";
  home_item.innerHTML = "<img src='/public/icons8-home.png' alt='' class='src' />";
  interaction.appendChild(home_item);

  const calendar_item = document.createElement("a");
  calendar_item.href = "/calendar";
  calendar_item.innerHTML = "<img src='/public/icon_calendar.png' alt='' class='src' />";
  interaction.appendChild(calendar_item);

  const search_item = document.createElement("a");
  search_item.href = "/";
  search_item.innerHTML = "<img src='/public/icons8-search.png' alt='' class='src' />";
  interaction.appendChild(search_item);
  
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
        Authorization: cookie,
      },
    })
      .then((response) => response.json())
      .then((text) => {
        const watchlist_btn = document.createElement("a");
        watchlist_btn.className = "watchlist_btn";
        watchlist_btn.innerHTML = "<img class='src' src='/public/icons8-bookmark-filled.png'>";
        watchlist_btn.href = "/watchlist";
        interaction.appendChild(watchlist_btn);

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
          switch (window.getComputedStyle(account_panel, null).display) {
            case "none": {
              account_panel.style.display = "flex";
              break;
            }
            case "flex": {
              account_panel.style.display = "none";
              break;
            }
          }
        };

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
        };
      });
  }
}

window.onload = () => menu();