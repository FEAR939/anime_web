(() => {
  const query = window.location.search;
  const params = new window.URLSearchParams(query);
  const url = params.get("v");

  const container = document.body.querySelector(".container");
  const anime_info = document.body.querySelector(".anime_info");
  const anime_seasonslist = document.body.querySelector(".anime_seasons_list");
  const anime_episodeslist = document.body.querySelector(
    ".anime_episodes_list",
  );
  let player;
  let marked = [];
  const cookie = localStorage.getItem("cookie");
  if (cookie) {
    fetch("/get-marked", {
      method: "POST",
      headers: {
        Authorization: cookie,
      },
      body: url
    })
    .then((response) => response.json())
    .then((text) => {
      try {
        marked = text;
        console.log(marked);
      } catch (e) {
        console.log(e);
      } finally {
        render_watch();
      }
    });
  } else {
    render_watch();
  }

  async function render_watch() {
    let doc = await get_dom("https://aniworld.to" + url);

    // get anime info

    const title = doc.querySelector(".series-title h1").textContent;
    const desc = doc
      .querySelector(".seri_des")
      .getAttribute("data-full-description");
    const image = doc
      .querySelector(".seriesCoverBox img")
      .getAttribute("data-src");
    const genres = Array.from(doc.querySelectorAll(".genres a")).map(
      (genre) => genre.textContent,
    );
    const rating = doc.querySelector(".starRatingResult strong").textContent;
    const imdb_link = doc.querySelector(".imdb-link").getAttribute("href");

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

    genres.forEach((genre) => {
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
    anime_desc.innerHTML =
      "<p><div class='desc_heading'>About</div></p>" + desc;
    anime_info.appendChild(anime_desc);

    const anime_marked = document.createElement("button");
    anime_marked.className = "anime_marked";
    anime_marked.textContent = "Add to Watchlist";
    anime_info.appendChild(anime_marked);

    if (cookie) {
      var state = false;
      if (marked[0] && marked[0].is_in_list) {
        state = true;
        anime_marked.textContent = "Remove from Watchlist";
      }

      anime_marked.onclick = () => {
        fetch("/handle-marked", {
          method: "POST",
          headers: {
            Authorization: cookie,
          },
          body: url,
        })
        .then((response) => {
          if (response.status !== 200) return
          if (state) {
            state = false;
            anime_marked.textContent = "Add to Watchlist";
          } else {
            state = true
            anime_marked.textContent = "Remove from Watchlist";
          }
        });
      }
    };

    // get anime seasons

    const lists = doc.querySelectorAll(".hosterSiteDirectNav ul");
    const seasons = lists[0].querySelectorAll("a");

    anime_seasonslist.innerHTML = "<option value=''>Please select a season</option>";

    seasons.forEach((item, i) => {
      // get season link

      const name = item.textContent;

      // create dom for season

      const anime_season = document.createElement("option");
      anime_season.textContent = name;
      anime_season.value = i;
      anime_seasonslist.appendChild(anime_season);
    });

    anime_seasonslist.addEventListener("change", async () => {
      if (anime_seasonslist.value.length == 0) return;
      anime_episodeslist.innerHTML = "<div class='spinner'></div>";

      // fetch season dom

      const item = seasons[anime_seasonslist.value];

      const redirect = item.getAttribute("href");

      let doc = await get_dom("https://aniworld.to" + redirect);

      // get episodes

      const episodes = doc.querySelectorAll("tbody tr");
      
      const imdb_doc = await get_dom(imdb_link + "/episodes/?season=" + item.textContent);

      const imdb_season_images = imdb_doc.querySelectorAll("article > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > img:nth-child(1)");

      let seen = [];
      if (cookie) {
        await fetch("/get-seen", {
          method: "POST",
          headers: {
            Authorization: cookie,
          },
          body: JSON.stringify([...episodes].map(episode => episode.getAttribute("data-episode-id")))
        })
        .then((response) => response.json())
        .then((text) => {
          try {
            seen = text;
          } catch (e) {
            console.log(e);
          }
        });
      }

      anime_episodeslist.innerHTML = "";
      
      episodes.forEach(async (item, i) => {
        // get episode redirect
        const anchor = item.querySelector(".seasonEpisodeTitle a");

        let redirect = anchor.getAttribute("href");
        let title = anchor.textContent;

        // create dom element

        const anime_episode = document.createElement("div");
        anime_episode.className = "anime_episode";
        anime_episodeslist.appendChild(anime_episode);

        const anime_episode_area = document.createElement("div");
        anime_episode_area.className = "anime_episode_area";
        anime_episode.appendChild(anime_episode_area);

        if (imdb_season_images.length > 0) {
          const anime_episode_image = document.createElement("img");
          anime_episode_image.className = "anime_episode_image";
          anime_episode_image.loading = "lazy";
          anime_episode_image.src = imdb_season_images[i].getAttribute("src");
          anime_episode.appendChild(anime_episode_image);
        }
      
        const anime_episode_inner = document.createElement("div");
        anime_episode_inner.className = "anime_episode_inner";
        anime_episode.appendChild(anime_episode_inner);

        const anime_episode_index = document.createElement("div");
        anime_episode_index.className = "anime_episode_index";
        anime_episode_inner.appendChild(anime_episode_index);

        const anime_episode_title = document.createElement("div");
        anime_episode_title.className = "anime_episode_title";
        anime_episode_inner.appendChild(anime_episode_title);

        var anime_episode_playtime = null;
        var anime_episode_playtime_bar = null;
        var anime_episode_playtime_bar_progress = null;
        var anime_episode_playtime_time = null;

        if (cookie) {
          const index = seen.findIndex(
            (a) => a.episode_id == episodes[i].getAttribute("data-episode-id"),
          );
          if (index !== -1) {
            anime_episode_playtime = document.createElement("div");
            anime_episode_playtime.className = "anime_episode_playtime";
            anime_episode.appendChild(anime_episode_playtime);

            anime_episode_playtime_bar = document.createElement("div");
            anime_episode_playtime_bar.className =
              "anime_episode_playtime_bar";
            anime_episode_playtime.appendChild(anime_episode_playtime_bar);

            anime_episode_playtime_bar_progress =
              document.createElement("div");
            anime_episode_playtime_bar_progress.className =
              "anime_episode_playtime_bar_progress";
            anime_episode_playtime_bar_progress.style.width =
              (seen[index].watch_playtime / seen[index].watch_duration) * 100 + "%";
            anime_episode_playtime_bar.appendChild(
              anime_episode_playtime_bar_progress,
            );

            anime_episode_playtime_time = document.createElement("div");
            anime_episode_playtime_time.className =
              "anime_episode_playtime_time";
            anime_episode_playtime_time.textContent =
              seen[index].watch_playtime + " / " + seen[index].watch_duration + " Min.";
            anime_episode_playtime.appendChild(anime_episode_playtime_time);
          }
        }

        // fetch episode dom

        const episode_index = redirect.substring(
          redirect.lastIndexOf("-") + 1,
        );

        anime_episode_index.textContent = "Episode " + episode_index;
        anime_episode_title.textContent = title;

        anime_episode_area.addEventListener("click", async () => {
          doc = await get_dom("https://aniworld.to" + redirect);

          // get language

          // const language = doc
          //     .querySelector(".selectedLanguage")
          //     .getAttribute("Title");

          // get video link

          var video_redirect = doc
            .querySelector(".watchEpisode")
            .getAttribute("href");

          console.log(video_redirect);

          doc = await get_dom("https://aniworld.to" + video_redirect);

          if (!document.querySelector(".video_container")) {
            const video_container = document.createElement("div");
            video_container.className = "video_container";
            document.body.appendChild(video_container);

            const video_exit = document.createElement("div");
            video_exit.className = "video_exit";
            video_exit.innerHTML =
              "<img src='/public/icons8-arrowleft.png' />";
            video_container.appendChild(video_exit);

            video_exit.onclick = () => {
              const playtimeM = Math.floor(video_player.currentTime / 60);
              const playdurationM = Math.floor(video_player.duration / 60);

              video_player.remove();
              video_container.remove();
              player = null;

              if (!cookie) return;

              fetch("/handle-seen", {
                method: "POST",
                headers: {
                  Authorization: cookie,
                },
                body: JSON.stringify({
                  playtime: playtimeM,
                  duration: playdurationM,
                  id: episodes[i].getAttribute("data-episode-id"),
                }),
              }).then((response) => {
                if (response.status == 401)
                  return console.log("Error marking episode as seen/unseen");
                if (
                  response.status == 200 &&
                  anime_episode_playtime !== null
                ) {
                  anime_episode_playtime_bar_progress.style.width =
                    (playtimeM / playdurationM) * 100 + "%";
                  anime_episode_playtime_time.textContent =
                    playtimeM + " / " + playdurationM + " Min.";
                } else {
                  anime_episode_playtime = document.createElement("div");
                  anime_episode_playtime.className = "anime_episode_playtime";
                  anime_episode.appendChild(anime_episode_playtime);

                  anime_episode_playtime_bar = document.createElement("div");
                  anime_episode_playtime_bar.className =
                    "anime_episode_playtime_bar";
                  anime_episode_playtime.appendChild(
                    anime_episode_playtime_bar,
                  );

                  anime_episode_playtime_bar_progress =
                    document.createElement("div");
                  anime_episode_playtime_bar_progress.className =
                    "anime_episode_playtime_bar_progress";
                  anime_episode_playtime_bar_progress.style.width =
                    (playtimeM / playdurationM) * 100 + "%";
                  anime_episode_playtime_bar.appendChild(
                    anime_episode_playtime_bar_progress,
                  );

                  anime_episode_playtime_time = document.createElement("div");
                  anime_episode_playtime_time.className =
                    "anime_episode_playtime_time";
                  anime_episode_playtime_time.textContent =
                    playtimeM + " / " + playdurationM + " Min.";
                  anime_episode_playtime.appendChild(
                    anime_episode_playtime_time,
                  );
                }
              });
            };

            const video_player = document.createElement("video");
            video_player.className = "video_player video-js";
            video_player.controls = "True";
            video_container.appendChild(video_player);

            player = videojs(video_player, {
              controlBar: {
                skipButtons: {
                  forward: 10,
                  backward: 10,
                },
              },
            });
          }

          const redirectScript = Array.from(
            doc.querySelectorAll("script"),
          ).find((script) => script.text.includes("window.location.href"));
          let redirectSource = redirectScript.textContent;

          const indexStart = redirectSource.indexOf(
            "window.location.href = '",
          );
          const indexEnd = redirectSource.indexOf(";", indexStart);
          redirectSource = redirectSource.substring(
            indexStart + 24,
            indexEnd - 1,
          );

          console.log(redirectSource);

          doc = await get_dom(redirectSource);

          // 3. Finding the relevant script tag (equivalent to re.compile and find_all)
          const scriptTag = Array.from(doc.querySelectorAll("script")).find(
            (script) => script.textContent.includes("var sources"),
          );
          let source = scriptTag.textContent;

          // 4. Extracting and cleaning the JSON string
          const startIndex = source.indexOf("var sources");
          const endIndex = source.indexOf(";", startIndex);
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
      });
    });
  }
})();
