'use strict';

import { debounce, copyText, addElement, removeElement } from './utils.js';

const BASE_URL = "https://cloud.digitalocean.com";
document.addEventListener("DOMContentLoaded", event => {
  // get searched results
  chrome.storage.local.get("searchedResults", data => {
    if (data.searchedResults != null) {
      showBuiltSearchResults(data.searchedResults);
    }
  });

  // sync if there are no results
  chrome.storage.local.get(null, (data) => {
    const lastSyncTimeTyped = Date.parse(data.lastSyncTime);
    const SIX_HOURS = 6000 * 60 * 60;

    if (data.droplets == null || lastSyncTimeTyped == "Invalid Date" || (Date.now() - SIX_HOURS) > lastSyncTimeTyped) {
      syncDroplets();
    }
  });

  // search input
  document.getElementById("search-input").addEventListener("input", (event) => {
    if (event.target.value.length >= 1) {
      debounce(searchForDroplet(event.target.value), 250);
    } else {
      showBuiltSearchResults("");
    }
  });

  // focus search box
  document.getElementById("search-input").focus();
});

const syncDroplets = () => {
  showStatusMessage("Syncing account data...");
  fetchDroplets().then(initialJson => {
    fetchDroplets(initialJson.meta.pagination.total).then((allResults) => {
      parseAndSaveDropletResults(allResults.droplets);
      resetStatusMessage();
    });
  });
};

const parseAndSaveDropletResults = (droplets) => {
  showStatusMessage("Parsing data...");
  const mappedDroplets = droplets.map((dp) => {
    return {
      id: dp.id,
      name: dp.name,
      pub_ipv4: dp.public_ipv4,
      private_ipv4: dp.private_ipv4,
      tags: dp.tags,
      dropletUrl: `${BASE_URL}/droplets/${dp.id}`,
      organization: dp.fleet.name
    };
  });
  showStatusMessage("Saving data...");
  chrome.storage.local.set({
    droplets: mappedDroplets
  });
  updateLastSyncDateTime();
  resetStatusMessage();
};

const updateLastSyncDateTime = () => {
  chrome.storage.local.set({
    lastSyncTime: new Date().toJSON()
  });
}

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

const showStatusMessage = (msg) => {
  resetStatusMessage();
  const el = document.createElement("span");

  el.id = "status-msg"
  el.innerHTML = msg;
  el.style.display = "block";

  document.body.appendChild(el);
};

const resetStatusMessage = () => {
  const statusMessageEl = document.getElementById("status-msg");

  if (statusMessageEl) {
    document.body.removeChild(statusMessageEl);
  }
};

const buildDropletSearchResults = (results) => {
  let resultsForDisplay = '<div class="list-group">';
  results.forEach((result) => {
    resultsForDisplay += `
      <div class="list-group-item list-group-item-action flex-column align-items-start">
        <div class="d-flex w-100 justify-content-between">
          <h5 class="mb-1"><a href="${result.dropletUrl}" target="_blank">${result.name}</a></h5>
          <small>
            <small>
              ${buildTag(result.organization)}
            </small>
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

const buildTags = tags => tags.map((tag) => buildTag(tag.name));
const buildTag = tagName => `<span class="badge badge-primary badge-pill">${tagName}</span>`;

const showBuiltSearchResults = (builtResults) => {
  if (builtResults && builtResults !== "") {
    addElement("results", "span", "search-results", builtResults);
    chrome.storage.local.set({
      searchedResults: builtResults
    });
    attachCopyPublicIpEvent();
    attachCopyPrivateIpEvent();
  } else {
    removeElement("search-results");
  }
};

const searchForDroplet = (searchingFor) => {
  chrome.storage.local.get("droplets", (data) => {
    const filtered = data.droplets.filter((dp) => {
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

    showBuiltSearchResults(buildDropletSearchResults(ordered));
  });
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
