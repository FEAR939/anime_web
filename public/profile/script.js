const cookie = localStorage.getItem("cookie");
if (cookie) {
fetch("/get-avatar", {
    headers: {
    Authorization: cookie,
    },
})
    .then((response) => response.json())
    .then((text) => {
        const account_info = document.querySelector(".account_info");
        const profile_links = document.querySelector(".profile_links");

        const avatar = document.createElement("img");
        avatar.className = "user_avatar";
        avatar.src = text.avatar;
        account_info.appendChild(avatar);

        const change_avatar = document.createElement("a");
        change_avatar.className = "change_avatar";
        change_avatar.textContent = "Change Avatar";
        change_avatar.href = "/avatar";
        profile_links.appendChild(change_avatar);

        const dashboard_btn = document.createElement("a");
        dashboard_btn.className = "dashboard_btn";
        dashboard_btn.textContent = "Dashboard";
        dashboard_btn.href = "/dashboard";
        profile_links.appendChild(dashboard_btn);

        const separator = document.createElement("hr");
        separator.className = "separator";
        profile_links.appendChild(separator);

        const logout_btn = document.createElement("div");
        logout_btn.className = "logout_btn";
        logout_btn.textContent = "Logout";
        profile_links.appendChild(logout_btn);

        logout_btn.onclick = () => {
          localStorage.removeItem("cookie");
          window.location.reload();
        };
    })
}