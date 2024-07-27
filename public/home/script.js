(() => {
    const anime_slider = document.body.querySelector(".anime_slider_container");
    const anime_slider_textbox = document.body.querySelector(".anime_slider_textbox");
    const anime_slider_index = document.body.querySelector(".anime_slider_index");
    const anime_cards = document.body.querySelector(".anime_cards");
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
            const avatar = document.createElement("img");
            avatar.className = "user_avatar";
            avatar.src = text.avatar;
            interaction.appendChild(avatar);
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

    async function slider_loop(slides) {
        let currentindex = 0;
        function loop() {
            slides[currentindex].slide.style.display = "block";
            anime_slider_textbox.textContent = slides[currentindex].title;
            slides[currentindex].index.style.background = "rgb(255, 165, 0)";
            slides[currentindex].index.style.height = "5px";

            setTimeout(() => {
                slides[currentindex].slide.style.display = "none";
                slides[currentindex].index.style.background = "rgb(100, 100, 100)";
                slides[currentindex].index.style.height = "4px";
                if (currentindex == (slides.length - 1)) {
                    currentindex = 0;
                } else {
                    currentindex++;
                }
                loop();
            }, 5000);
        }

        loop();
    }

    async function render_home() {
        const doc = await get_dom("https://aniworld.to");
        const slides = doc.querySelectorAll(".homeSliderSection a");

        const slide_elements = [];

        slides.forEach((slide) => {
            // const redirect = slide.getAttribute("href");
            const image = slide.querySelector("img").getAttribute("data-src");
            const title = slide.querySelector("span").textContent;

            const anime_slide = document.createElement("a");
            anime_slide.className = "anime_slide";
            anime_slide.href = "/";

            const anime_slide_image = document.createElement("img");
            anime_slide_image.className = "anime_slide_image";
            anime_slide_image.src = "https://aniworld.to" + image;
            anime_slide.appendChild(anime_slide_image);

            const anime_index = document.createElement("div");
            anime_index.className = "anime_index";
            anime_slider_index.appendChild(anime_index);

            slide_elements.push({
                slide: anime_slide,
                title: title,
                index: anime_index,
            });
            
            anime_slider.appendChild(anime_slide);
        });

        slider_loop(slide_elements);

        const anime_elements = doc.querySelector(".carousel").querySelectorAll(".coverListItem a");

        anime_elements.forEach(async (anime_element) => {
            // get anime link

            const redirect = anime_element.getAttribute("href");
            const image = anime_element.querySelector("img").getAttribute("data-src");
            const title = anime_element.textContent.trim();

            const doc = await get_dom("https://aniworld.to" + redirect);
            const genres = Array.from(doc.querySelectorAll(".genres a")).map((genre) => genre.textContent).join(", ");
            const desc = doc.querySelector(".seri_des").getAttribute("data-full-description");
            const rating = doc.querySelector(".starRatingResult strong").textContent;

            // create DOM element

            const home_card = document.createElement("div");
            home_card.className = "home_card";

            const home_card_image = document.createElement("img");
            home_card_image.className = "home_card_image";
            home_card_image.src = "https://aniworld.to" + image;
            home_card.appendChild(home_card_image);

            const home_card_box = document.createElement("div");
            home_card_box.className = "home_card_box";
            home_card.appendChild(home_card_box);

            home_card_image.onload = () => {
                window.onresize = () => home_card_box.clientHeight = home_card_image.height + "px";
                home_card_box.clientHeight = home_card_image.height + "px";
            }

            const home_card_title = document.createElement("div");
            home_card_title.className = "home_card_title";
            home_card_title.textContent = title;
            home_card_box.appendChild(home_card_title);
            
            const home_card_genres = document.createElement("div");
            home_card_genres.className = "home_card_genres";
            home_card_genres.textContent = genres;
            home_card_box.appendChild(home_card_genres);

            const home_card_rating = document.createElement("div");
            home_card_rating.className = "home_card_rating";
            home_card_rating.innerHTML = rating + '<img src="/public/icons8-star.png">';
            home_card_box.appendChild(home_card_rating);

            const home_card_desc = document.createElement("div");
            home_card_desc.className = "home_card_desc";
            home_card_desc.textContent = desc;
            home_card_box.appendChild(home_card_desc);

            const home_card_watch = document.createElement("a");
            home_card_watch.className = "home_card_watch";
            home_card_watch.textContent = "Watch now";
            home_card_watch.href = "/watch?v=https://aniworld.to" + redirect;
            home_card_box.appendChild(home_card_watch);

            anime_cards.appendChild(home_card);
        });
    }

    render_home();
})()