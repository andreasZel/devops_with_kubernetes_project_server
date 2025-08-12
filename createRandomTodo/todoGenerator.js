async function generateRandomArticle() {
  try {
    const response = await fetch("https://en.wikipedia.org/wiki/Special:Random", {
      method: "GET",
      redirect: "manual"
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        console.error("No Location header found");
        return;
      }
      console.log("Redirect location:", location);

      const postResponse = await fetch("http://todos-svc.project:2020/todos", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newTodo: `Read ${location}, here ${location}` })
      });

      if (!postResponse.ok) {
        console.error("Failed to post todo: ", response?.statusText);
      }
    } else {
      console.error(`Unexpected status code: ${response.status}`);
    }
  } catch (error) {
    console.error("Error fetching random article:", error);
  }
}

generateRandomArticle();
