(() => {
    const anime_info = document.body.querySelector(".anime_info");
    const anime_seasonslist = document.body.querySelector(".anime_seasons_list");
    const anime_episodeslist = document.body.querySelector(".anime_episodes_list");
    let player;
    let seen;
    const cookie = localStorage.getItem("cookie");
    if (cookie) {
        fetch("/get-seen", {
            method: "GET",
            headers: {
                "Authorization": cookie
            }
        }).then(response => response.json()).then(text => {
            seen = JSON.parse(text.seen);
            render_watch();
        });
    } else {
        render_watch();
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

        const anime_image = document.createElement("img");
        anime_image.className = "anime_image";
        anime_image.src = "https://aniworld.to" + image;
        anime_info.appendChild(anime_image);

        const anime_box = document.createElement("div");
        anime_box.className = "anime_box";
        anime_info.appendChild(anime_box);
        anime_box.offsetHeight = anime_image.offsetHeight;

        anime_image.onload = () => {
            window.onresize = () => anime_box.style.height = anime_image.height + "px";
            anime_box.style.height = anime_image.height + "px"
        };

        const anime_title = document.createElement("div");
        anime_title.className = "anime_title";
        anime_title.textContent = title;
        anime_box.appendChild(anime_title);

        const anime_desc = document.createElement("div");
        anime_desc.className = "anime_desc";
        anime_desc.textContent = desc;
        anime_box.appendChild(anime_desc);

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

                    const anime_episode_index = document.createElement("div");
                    anime_episode_index.className = "anime_episode_index";
                    anime_episode.appendChild(anime_episode_index);

                    const anime_episode_title = document.createElement("div");
                    anime_episode_title.className = "anime_episode_title";
                    anime_episode.appendChild(anime_episode_title);

                    const anime_episode_seen = document.createElement("button");
                    anime_episode_seen.className = "anime_episode_seen";
                    anime_episode_seen.textContent = "Seen";
                    anime_episode.appendChild(anime_episode_seen);

                    const anime_episode_watch = document.createElement("button");
                    anime_episode_watch.className = "anime_episode_watch";
                    anime_episode_watch.textContent = "Watch";
                    anime_episode.appendChild(anime_episode_watch);

                    if (cookie) {
                        if (seen.indexOf(redirect) !== -1) anime_episode_seen.style.background = "rgb(255, 165, 0)";

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
                                if (result.action == "added") return anime_episode_seen.style.background = "rgb(255, 165, 0)";
                                if (result.action == "removed") return anime_episode_seen.style.background = "rgb(46, 46, 46)";
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

                    anime_episode_watch.addEventListener("click", async () => {
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
                            video_exit.textContent = "x";
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