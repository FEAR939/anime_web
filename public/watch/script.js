(() => {
    const container = document.body.querySelector(".container");
    const interaction = document.body.querySelector(".interaction");
    const anime_info = document.body.querySelector(".anime_info");
    const anime_seasonslist = document.body.querySelector(".anime_seasons_list");
    const anime_episodeslist = document.body.querySelector(".anime_episodes_list");
    let player;
    let seen;
    let marked;
    const cookie = localStorage.getItem("cookie");
    if (cookie) {
        fetch("/get-seen", {
            method: "GET",
            headers: {
                "Authorization": cookie
            }
        }).then(response => response.json()).then(text => {
            seen = JSON.parse(text.seen);
            fetch("/get-marked", {
                method: "GET",
                headers: {
                    "Authorization": cookie
                }
            }).then(response => response.json()).then(text => {
                marked = JSON.parse(text.marked);
                render_watch();
            });
        });
    } else {
        render_watch();
    }

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

    async function render_watch() {
        const query = window.location.search;
        const params = new window.URLSearchParams(query);
        const url = params.get("v");

        let doc = await get_dom(url);

        // get anime info

        const title = doc.querySelector(".series-title h1").textContent;
        const desc = doc.querySelector(".seri_des").getAttribute("data-full-description");
        const image = doc.querySelector(".seriesCoverBox img").getAttribute("data-src");
        const genres = Array.from(doc.querySelectorAll(".genres a")).map((genre) => genre.textContent);
        const rating = doc.querySelector(".starRatingResult strong").textContent;

        const anime_image = document.createElement("img");
        anime_image.className = "anime_image";
        anime_image.src = "https://aniworld.to" + image;
        container.appendChild(anime_image);

        const anime_title = document.createElement("div");
        anime_title.className = "anime_title";
        anime_title.textContent = title;
        anime_info.appendChild(anime_title);

        const anime_genres = document.createElement("div");
        anime_genres.className = "anime_genres";
        anime_info.appendChild(anime_genres);

        genres.forEach(genre => {
            const anime_genre = document.createElement("div");
            anime_genre.className = "anime_genre";
            anime_genre.textContent = genre;
            anime_genres.appendChild(anime_genre);
        });

        const anime_rating = document.createElement("div");
        anime_rating.className = "anime_rating";
        anime_rating.innerHTML = rating + '<img src="/public/icons8-star.png">';
        anime_info.appendChild(anime_rating);

        const anime_desc = document.createElement("div");
        anime_desc.className = "anime_desc";
        anime_desc.innerHTML = "<p><div class='desc_heading'>About</div></p>" + desc;
        anime_info.appendChild(anime_desc);

        const anime_marked = document.createElement("button");
        anime_marked.className = "anime_marked";
        anime_marked.textContent = "Add to Watchlist";
        anime_info.appendChild(anime_marked);

        if (cookie) {
            if (marked.indexOf(url) !== -1) {
                anime_marked.textContent = "Remove from Watchlist";
            }

            anime_marked.onclick = () => {
                fetch("/handle-marked", {
                    method: "POST",
                    headers: {
                        "Authorization": cookie,
                    },
                    body: url,
                }).then(response => {
                    if (response.status == 401) return console.log("Error marking episode as seen/unseen");
                    return response.json();
                }).then(result => {
                    if (result.action == "added") {
                        anime_marked.textContent = "Remove from Watchlist";
                        return;
                    }
                    if (result.action == "removed") {
                        anime_marked.textContent = "Add to Watchlist";
                        return;
                    }
                })
            }
        }

        // get anime seasons

        const lists = doc.querySelectorAll(".hosterSiteDirectNav ul");
        const seasons = lists[0].querySelectorAll("a");

        seasons.forEach((item) => {
            // get season link

            const redirect = item.getAttribute("href");
            const name = item.textContent;

            // create dom for season

            const anime_season = document.createElement("div");
            anime_season.className = "anime_season";
            anime_season.textContent = name;
            anime_seasonslist.appendChild(anime_season);

            anime_season.addEventListener("click", async () => {
                anime_episodeslist.innerHTML = "";

                // fetch season dom

                let doc = await get_dom("https://aniworld.to" + redirect);

                // get episodes

                const episodes = doc.querySelectorAll(
                "tbody tr .seasonEpisodeTitle a",
                );

                episodes.forEach(async (item) => {
                    // get episode redirect

                    let redirect = item.getAttribute("href");
                    let title = item.textContent;

                    // create dom element

                    const anime_episode = document.createElement("div");
                    anime_episode.className = "anime_episode";
                    anime_episodeslist.appendChild(anime_episode);

                    const anime_episode_area = document.createElement("div");
                    anime_episode_area.className = "anime_episode_area";
                    anime_episode.appendChild(anime_episode_area);

                    const anime_episode_index = document.createElement("div");
                    anime_episode_index.className = "anime_episode_index";
                    anime_episode.appendChild(anime_episode_index);

                    const anime_episode_title = document.createElement("div");
                    anime_episode_title.className = "anime_episode_title";
                    anime_episode.appendChild(anime_episode_title);

                    const anime_episode_seen = document.createElement("button");
                    anime_episode_seen.className = "anime_episode_seen";
                    anime_episode_seen.innerHTML = "<img src='/public/icons8-bookmark-filled.png'>";
                    anime_episode.appendChild(anime_episode_seen);

                    if (cookie) {
                        if (seen.indexOf(redirect) !== -1) {
                            anime_episode_seen.style.background = "rgb(127,0,255)";
                        }

                        anime_episode_seen.onclick = () => {
                            fetch("/handle-seen", {
                                method: "POST",
                                headers: {
                                    "Authorization": cookie,
                                },
                                body: redirect,
                            }).then(response => {
                                if (response.status == 401) return console.log("Error marking episode as seen/unseen");
                                return response.json();
                            }).then(result => {
                                if (result.action == "added") {
                                    anime_episode_seen.style.background = "rgb(127,0,255)";
                                    return;
                                }
                                if (result.action == "removed") {
                                    anime_episode_seen.style.background = "rgb(39,39,39)";
                                    return;
                                }
                            })
                        }
                    }

                    // fetch episode dom

                    const episode_index = redirect.substring(
                        redirect.lastIndexOf("-") + 1,
                    );

                    // fetch redirect header

                    // fetch("cors-fetch", {
                    //     method: "POST",
                    //     body: "GET https://aniworld.to" + redirect
                    // }).then((res) => {
                    anime_episode_index.textContent = "Episode " + episode_index;
                    anime_episode_title.textContent = title;

                    anime_episode_area.addEventListener("click", async () => {
                        doc = await get_dom("https://aniworld.to" + redirect);

                        // get language

                        // const language = doc
                        //     .querySelector(".selectedLanguage")
                        //     .getAttribute("Title");

                        // get video link

                        redirect = doc
                            .querySelector(".watchEpisode")
                            .getAttribute("href");

                        console.log(redirect);

                        doc = await get_dom("https://aniworld.to" + redirect);
                        
                        if (!document.querySelector(".video_container")) {
                            const video_container = document.createElement("div");
                            video_container.className = "video_container";
                            document.body.appendChild(video_container);

                            const video_exit = document.createElement("div");
                            video_exit.className = "video_exit";
                            video_exit.innerHTML = "<img src='/public/icons8-arrowleft.png' />";
                            video_container.appendChild(video_exit);

                            video_exit.onclick = () => {
                                video_player.remove();
                                video_container.remove();
                                player = null;
                            }

                            const video_player = document.createElement("video");
                            video_player.className = "video_player video-js";
                            video_player.controls = "True";
                            video_container.appendChild(video_player);

                            player = videojs(video_player);
                        }


                        const redirectScript = Array.from(
                            doc.querySelectorAll("script"),
                        ).find((script) =>
                            script.text.includes("window.location.href"),
                        );
                        let redirectSource = redirectScript.textContent;

                        const indexStart = redirectSource.indexOf(
                            "window.location.href = '",
                        );
                        const indexEnd = redirectSource.indexOf(
                            ";",
                            indexStart,
                        );
                        redirectSource = redirectSource.substring(
                            indexStart + 24,
                            indexEnd - 1,
                        );

                        console.log(redirectSource);

                        doc = await get_dom(redirectSource);

                        // 3. Finding the relevant script tag (equivalent to re.compile and find_all)
                        const scriptTag = Array.from(
                            doc.querySelectorAll("script"),
                        ).find((script) =>
                            script.textContent.includes("var sources"),
                        );
                        let source = scriptTag.textContent;

                        // 4. Extracting and cleaning the JSON string
                        const startIndex =
                            source.indexOf("var sources");
                        const endIndex = source.indexOf(
                            ";",
                            startIndex,
                        );
                        source = source.substring(startIndex, endIndex);
                        source = source.replace("var sources = ", "");
                        source = source
                            .replace(/'/g, '"')
                            .replace(/\\n/g, "")
                            .replace(/\\/g, ""); // Remove newline and backslashes

                        // Handle trailing comma if present

                        source = source.substring(1);
                        source = source.slice(0, -1);
                        source = source.trim();
                        source = source.slice(0, -1);
                        source = "{" + source + "}";
                        source = JSON.parse(source);

                        const hls = atob(source.hls);
                        console.log(hls);

                        player.src({ src: hls });
                    });
                    // });
                });
            });
        });
    }
})()