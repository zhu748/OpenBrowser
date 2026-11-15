"use strict";

// Chromium profile-file preparation. Browser process and lock ownership stay in the launch pipeline.
const fsp = require("node:fs/promises");
const path = require("node:path");
const { writeRawAtomically } = require("./state-storage");

const SEARCH_ENGINE_TEMPLATES = {
  google: {
    short_name: "Google",
    keyword: "google.com",
    favicon_url: "https://www.google.com/favicon.ico",
    url: "https://www.google.com/search?q={searchTerms}",
    suggestions_url:
      "https://www.google.com/complete/search?client=chrome&q={searchTerms}",
  },
  bing: {
    short_name: "Microsoft Bing",
    keyword: "bing.com",
    favicon_url: "https://www.bing.com/favicon.ico",
    url: "https://www.bing.com/search?q={searchTerms}",
    suggestions_url: "https://www.bing.com/osjson.aspx?query={searchTerms}",
  },
  yahoo: {
    short_name: "Yahoo",
    keyword: "yahoo.com",
    favicon_url: "https://www.yahoo.com/favicon.ico",
    url: "https://search.yahoo.com/search?p={searchTerms}",
    suggestions_url: "https://search.yahoo.com/sugg/os?command={searchTerms}",
  },
  yandex: {
    short_name: "Yandex",
    keyword: "yandex.com",
    favicon_url: "https://yandex.com/favicon.ico",
    url: "https://yandex.com/search/?text={searchTerms}",
    suggestions_url:
      "https://suggest.yandex.com/suggest-ff.cgi?part={searchTerms}",
  },
  duckduckgo: {
    short_name: "DuckDuckGo",
    keyword: "duckduckgo.com",
    favicon_url: "https://duckduckgo.com/favicon.ico",
    url: "https://duckduckgo.com/?q={searchTerms}",
    suggestions_url: "https://duckduckgo.com/ac/?q={searchTerms}&type=list",
  },
};

async function applyDefaultSearchEngine(root, engine) {
  const template = SEARCH_ENGINE_TEMPLATES[String(engine || "")];
  if (!template) return false;
  const prefsPath = path.join(root, "Default", "Preferences");
  let prefs = {};
  try {
    prefs = JSON.parse(await fsp.readFile(prefsPath, "utf8"));
  } catch (_) {
    prefs = {};
  }
  prefs.default_search_provider_data =
    prefs.default_search_provider_data &&
    typeof prefs.default_search_provider_data === "object"
      ? prefs.default_search_provider_data
      : {};
  prefs.default_search_provider_data.template_url_data = {
    short_name: template.short_name,
    keyword: template.keyword,
    url: template.url,
    suggestions_url: template.suggestions_url,
    favicon_url: template.favicon_url,
    safe_for_autoreplace: false,
    originating_url: "",
    prepopulate_id: 0,
    date_created: "13300000000000000",
    last_modified: "13300000000000000",
    sync_guid: "openbrowser-" + String(engine),
    alternate_urls: [],
  };
  try {
    await fsp.mkdir(path.dirname(prefsPath), { recursive: true });
    // Atomic write (temp + rename): a partial Preferences file would be read by
    // the kernel as a corrupt profile on the very next launch.
    await writeRawAtomically(prefsPath, JSON.stringify(prefs));
    return true;
  } catch (_) {
    return false;
  }
}

const CHROMIUM_LAUNCH_DATA_TARGETS = {
  cookies: [
    "Default/Network/Cookies",
    "Default/Network/Cookies-journal",
    "Default/Cookies",
    "Default/Cookies-journal",
  ],
  localStorage: [
    "Default/Local Storage/leveldb",
    "Default/Session Storage",
    "Default/IndexedDB",
  ],
  history: [
    "Default/History",
    "Default/History-journal",
    "Default/History Provider Cache",
    "Default/Visited Links",
  ],
};

function clearProfileLaunchData(root, profile) {
  const advanced =
    profile?.advanced && typeof profile.advanced === "object"
      ? profile.advanced
      : {};
  return clearLaunchDataTargets(root, advanced, CHROMIUM_LAUNCH_DATA_TARGETS);
}

async function clearLaunchDataTargets(root, advanced, targets) {
  const switches = advanced && typeof advanced === "object" ? advanced : {};
  const rm = async (relative) => {
    try {
      await fsp.rm(path.join(root, relative), { recursive: true, force: true });
      return true;
    } catch (_) {
      return false;
    }
  };
  const removed = [];
  if (switches.clearCookiesOnStart) {
    for (const relative of targets.cookies) {
      if (await rm(relative)) removed.push(relative);
    }
  }
  if (switches.clearLocalStorageOnStart) {
    for (const relative of targets.localStorage) {
      if (await rm(relative)) removed.push(relative);
    }
  }
  if (switches.clearHistoryOnStart) {
    for (const relative of targets.history) {
      if (await rm(relative)) removed.push(relative);
    }
  }
  return removed;
}

module.exports = {
  applyDefaultSearchEngine,
  clearProfileLaunchData,
  clearLaunchDataTargets,
};
