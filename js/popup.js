const BASE_URL =
  "https://cloud.digitalocean.com/api/v1/droplets?include_failed=true";
document.addEventListener("DOMContentLoaded", event => {
  // sync button
  document.getElementById("sync-button").addEventListener("click", () => {
    fetchDroplets(`${BASE_URL}&per_page=1`).then(initialJson => {
      fetchDroplets(
        `${BASE_URL}&per_page=${initialJson.meta.pagination.total}`
      ).then(allResults => {
        parseAndSaveResults(allResults.droplets);
      });
    });
  });
  // search button
  document.getElementById("search-button").addEventListener("click", () => {
    const searchingFor = document.getElementById("search-input").value;
    chrome.storage.local.get("results", function(data) {
      const filtered = data.results.filter(dp => {
        return (
          dp.name.search(searchingFor) > -1 ||
          dp.tags.filter(tag => tag.name.search(searchingFor) > -1).length > 0
        );
      });
      alert(JSON.stringify(filtered));
    });
  });
});

const parseAndSaveResults = results => {
  const parsedResults = results.map(dp => {
    return {
      name: dp.name,
      pub_ipv4: dp.public_ipv4,
      private_ipv4: dp.private_ipv4,
      tags: dp.tags
    };
  });
  chrome.storage.local.set({ results: parsedResults });
};

const fetchDroplets = async url => {
  const response = await fetch(url, { credentials: "include" });
  const responseOk = await response.ok;

  if (responseOk) {
    return await response.json();
  } else {
    alert(
      "There was a problem fetching data form DO. Make sure you are logged in"
    );
  }
};
