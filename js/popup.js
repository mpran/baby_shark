import { debounce } from './utils.js';

const BASE_URL = "https://cloud.digitalocean.com";
document.addEventListener("DOMContentLoaded", event => {
  // get searched results
  chrome.storage.local.get("results", data => {
    // sync if there are no results
    if (data.results == null) {
      syncAccountData();
    }
  });

  // search input
  document.getElementById("search-input").addEventListener("input", event => {
    if (event.target.value.length >= 1) {
      debounce(searchForDroplet(event.target.value), 250);
    } else {
      showBuiltSearchResults("");
    }
  });

  // focus search box
  document.getElementById("search-input").focus();
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
  let resultsForDisplay = '<div class="list-group">';
  results.forEach(result => {
    resultsForDisplay += `
      <div class="list-group-item list-group-item-action flex-column align-items-start">
        <div class="d-flex w-100 justify-content-between">
          <h5 class="mb-1"><a href="${result.dropletUrl}" target="_blank">${result.name}</a></h5>
          <small>
            <div><a href="#" aria-data="${result.pub_ipv4}" name="copy-public-ip">Public IP</a></div>
            <div><a href="#" aria-data="${result.private_ipv4}" name="copy-private-ip">Private IP</a></div>
          </small>
        </div>
        <small>
          ${buildTags(result.tags)}
        </small>
      </div>
    `;
  });

  resultsForDisplay += '</div>'

  return resultsForDisplay;
};

const buildTags = tags => tags.map(tag => `<span class="badge badge-primary badge-pill">${tag.name}</span>`);

const showBuiltSearchResults = builtResults => {
  const searchResultsElement = document.getElementById("search-results");

  if (builtResults && builtResults !== "") {
    searchResultsElement.innerHTML =
      builtResults == null || builtResults === "" ? "" : builtResults;
    chrome.storage.local.set({
      searchedResults: builtResults
    });
    attachCopyPublicIpEvent();
    attachCopyPrivateIpEvent();
  } else {
    searchResultsElement.innerHTML = "";
  }
};

const searchForDroplet = searchingFor => {
  chrome.storage.local.get("results", data => {
    const filtered = data.results.filter(dp => {
      return (
        dp.name.search(searchingFor) > -1 ||
        dp.tags.filter(tag => tag.name.search(searchingFor) > -1).length > 0 ||
        dp.pub_ipv4.search(searchingFor) > -1 ||
        (dp.private_ipv4 && dp.private_ipv4.search(searchingFor) > -1)
      );
    });

    const ordered = filtered.sort((a, b) => {
      if (a.name < b.name) { return -1 }
      if (a.name > b.name) { return 1 }

      return 0;
    });

    showBuiltSearchResults(buildSearchResults(ordered));
  });
};

const copyText = text => {
  const el = document.createElement("textarea");
  el.type = "hidden";
  el.value = text;
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
};

const attachCopyPublicIpEvent = () => {
  document.getElementsByName("copy-public-ip").forEach(copy => {
    copy.addEventListener("click", event => {
      copyText(event.target.attributes["aria-data"].value);
    });
  });
};

const attachCopyPrivateIpEvent = () => {
  document.getElementsByName("copy-private-ip").forEach(copy => {
    copy.addEventListener("click", event => {
      copyText(event.target.attributes["aria-data"].value);
    });
  });
};
