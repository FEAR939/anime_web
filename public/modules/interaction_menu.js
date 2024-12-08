menu();

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
  search_item.href = "/search";
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
        watchlist_btn.innerHTML = "<img class='src' src='/public/icons8-bookmark-filled.png'>";
        watchlist_btn.href = "/watchlist";
        interaction.appendChild(watchlist_btn);

        const account = document.createElement("a");
        account.href = "/profile";
        interaction.appendChild(account);

        const avatar = document.createElement("img");
        avatar.className = "user_avatar";
        avatar.src = text.avatar_url;
        account.appendChild(avatar);
    });
  }
}