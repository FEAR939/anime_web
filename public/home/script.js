(() => {
  const anime_slider = document.body.querySelector(".anime_slider_container");
  const anime_slider_textbox = document.body.querySelector(
    ".anime_slider_textbox",
  );
  const anime_slider_index = document.body.querySelector(".anime_slider_index");
  const anime_cards = document.body.querySelector(".anime_cards_slider");
  const interaction = document.body.querySelector(".interaction");
  const schedule_dropdown = document.body.querySelector(".schedule_date");
  const schedules_container = document.body.querySelector(
    ".schedules_container",
  );

  menu(interaction);

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

  async function renderSchedule() {
    const doc = await get_dom("https://aniworld.to/animekalender");

    const sections = doc.querySelectorAll("section");
    const schedules = [];

    sections.forEach((section, i) => {
      const date = section.querySelector("h3").textContent;
      const option = document.createElement("option");
      option.value = i;
      option.textContent = date;
      schedule_dropdown.appendChild(option);

      const schedule = [];

      const elements = section.querySelectorAll("a");

      elements.forEach((element) => {
        const title = element.querySelector("h3").textContent;
        const stats = element.querySelectorAll("small");
        const image = stats[0].querySelector("img").getAttribute("data-src");
        schedule.push({
          title: title,
          ep: stats[0].textContent.trim(),
          image: image,
          time: stats[1].textContent.trim(),
        });
      });

      schedules.push(schedule);
    });

    var expand_state = false;
    const expand = document.createElement("div");
    expand.className = "expand";

    function renderSchedules(items, length) {
      schedules_container.innerHTML = "";
      items.slice(0, length).forEach((item) => {
        const node = document.createElement("div");
        node.className = "schedule_item";

        const node_title = document.createElement("div");
        node_title.className = "schedule_item_title";
        node_title.textContent = item.title;
        node.appendChild(node_title);

        const node_ep = document.createElement("div");
        node_ep.className = "schedule_item_ep";
        node_ep.textContent = item.ep;
        node.appendChild(node_ep);

        const node_lang = document.createElement("img");
        node_lang.className = "schedule_item_image";
        node_lang.src = "https://aniworld.to" + item.image;
        node.appendChild(node_lang);

        const node_time = document.createElement("div");
        node_time.className = "schedule_item_time";
        node_time.textContent = item.time;
        node.appendChild(node_time);

        schedules_container.appendChild(node);
        expand.textContent = expand_state ? "Collapse" : "Expand";
        schedules_container.appendChild(expand);
      });
    }

    renderSchedules(schedules[0], 5);
    expand.addEventListener("click", () => {
      expand_state = expand_state ? false : true;
      var length = expand_state ? schedules[schedule_dropdown.value].length : 5;
      renderSchedules(schedules[schedule_dropdown.value], length);
    });

    schedule_dropdown.addEventListener("change", () => {
      renderSchedules(schedules[schedule_dropdown.value]);
    });
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
  renderSchedule();
})();
