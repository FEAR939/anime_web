async function get_dom(url) {
    try {
      const response = await fetch("/cors-fetch", {
        method: "POST",
        body: "GET " + url,
      });
      const text = await response.text();
      const parser = new DOMParser();
      const dom = parser.parseFromString(text, "text/html");

      return dom;
    } catch (error) {
      console.error("Error fetching DOM:", error);
      throw error;
    }
  }