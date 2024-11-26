(() => {
  const anime_slider = document.body.querySelector(".anime_slider_container");
  const anime_slider_textbox = document.body.querySelector(
    ".anime_slider_textbox",
  );
  const anime_slider_index = document.body.querySelector(".anime_slider_index");
  const anime_cards = document.body.querySelector(".anime_cards_slider");

  async function slider_loop(slides) {
    let currentindex = 0;
    function loop() {
      anime_slider.appendChild(slides[currentindex].slide);
      anime_slider_textbox.textContent = slides[currentindex].title;
      anime_slider_index.textContent = currentindex + 1 + "/" + slides.length;

      setTimeout(() => {
        slides[currentindex].slide.remove();
        if (currentindex == slides.length - 1) {
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

      const anime_slide = document.createElement("div");
      anime_slide.className = "anime_slide";

      const anime_slide_image = document.createElement("img");
      anime_slide_image.className = "anime_slide_image";
      anime_slide_image.loading = "lazy";
      anime_slide_image.src = "https://aniworld.to" + image;
      anime_slide.appendChild(anime_slide_image);

      slide_elements.push({
        slide: anime_slide,
        title: title,
      });
    });

    slider_loop(slide_elements);

    const anime_elements = doc
      .querySelector(".carousel")
      .querySelectorAll(".coverListItem a");

    anime_elements.forEach(async (anime_element) => {
      // get anime link

      const redirect = anime_element.getAttribute("href");
      const image = anime_element.querySelector("img").getAttribute("data-src");
      const title = anime_element.querySelector("h3").textContent.trim();

      // create DOM element

      const home_card = document.createElement("div");
      home_card.className = "home_card";

      const home_card_image = document.createElement("img");
      home_card_image.className = "home_card_image";
      home_card_image.loading = "lazy";
      home_card_image.src = "https://aniworld.to" + image;
      home_card.appendChild(home_card_image);

      const home_card_title = document.createElement("div");
      home_card_title.className = "home_card_title";
      home_card_title.textContent = title;
      home_card.appendChild(home_card_title);

      home_card.onclick = () => {
        window.location.replace("/watch?v=https://aniworld.to" + redirect);
      };

      anime_cards.appendChild(home_card);
    });
  }

  render_home();
})();
