const BASE_URL = "https://cloud.digitalocean.com";
document.addEventListener("DOMContentLoaded", event => {
  // get searched results
  chrome.storage.local.get("searchedResults", function(data) {
    showBuiltSearchResults(data.searchedResults);
  });

  // get searched results
  chrome.storage.local.get("results", function(data) {
    // sync if there are no results
    if (data.results == null) {
      syncAccountData();
    }
  });
  // search button
  document.getElementById("search-button").addEventListener("click", () => {
    searchForDroplet();
  });

  // search input
  document.getElementById("search-input").addEventListener("keyup", event => {
    if (event.keyCode === 13) {
      searchForDroplet();
    }
  });
});

const syncAccountData = () => {
  showStatusMessage("Syncing account data...");
  fetchDroplets().then(initialJson => {
    fetchDroplets(initialJson.meta.pagination.total).then(allResults => {
      parseAndSaveResults(allResults.droplets);
      resetStatusMessage();
    });
  });
};

const parseAndSaveResults = results => {
  showStatusMessage("Parsing data...");
  const parsedResults = results.map(dp => {
    return {
      id: dp.id,
      name: dp.name,
      pub_ipv4: dp.public_ipv4,
      private_ipv4: dp.private_ipv4,
      tags: dp.tags,
      dropletUrl: `${BASE_URL}/droplets/${dp.id}`
    };
  });
  showStatusMessage("Saving data...");
  chrome.storage.local.set({
    results: parsedResults,
    lastSyncTime: new Date()
  });
  resetStatusMessage();
};

const fetchDroplets = async (resultsPerPage = 1) => {
  const response = await fetch(
    `${BASE_URL}/api/v1/droplets?include_failed=true&per_page=${resultsPerPage}`,
    {
      credentials: "include"
    }
  );
  const responseOk = await response.ok;

  if (responseOk) {
    return await response.json();
  } else {
    const error = await response.status;
    alert(`There was a problem fetching data form DO. ${error}`);
  }
};

const showStatusMessage = msg => {
  const statusMessageEl = document.getElementById("status-msg");
  statusMessageEl.innerHTML = msg;
  statusMessageEl.style.display = "block";
};

const resetStatusMessage = () => {
  const statusMessageEl = document.getElementById("status-msg");
  statusMessageEl.innerHTML = "";
  statusMessageEl.style.display = "none";
};

const buildSearchResults = results => {
  let resultsForDisplay = "";
  results.forEach(result => {
    resultsForDisplay += `<div><a href="${result.dropletUrl}" target="_blank">${
      result.name
    }</a></div>`;
  });

  return resultsForDisplay;
};

const showBuiltSearchResults = builtResults => {
  document.getElementById("search-results").innerHTML =
    builtResults == null || builtResults === "" ? "" : builtResults;
  if (builtResults !== "") {
    chrome.storage.local.set({
      searchedResults: builtResults
    });
  }
};

const searchForDroplet = () => {
  const searchingFor = document.getElementById("search-input").value;
  chrome.storage.local.get("results", function(data) {
    const filtered = data.results.filter(dp => {
      return (
        dp.name.search(searchingFor) > -1 ||
        dp.tags.filter(tag => tag.name.search(searchingFor) > -1).length > 0
      );
    });
    showBuiltSearchResults(buildSearchResults(filtered));
  });
};
