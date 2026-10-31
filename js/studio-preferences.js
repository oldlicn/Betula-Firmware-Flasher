/* UV Studio resilient preference storage.
   Keeps the application usable when localStorage is unavailable on file://
   or disabled by the browser. */
;(function () {
    "use strict";

    const memory = new Map();

    function get(key, fallback) {
        try {
            const value = localStorage.getItem(key);
            if (value !== null) return value;
        } catch (error) {
            /* Fall through to the in-memory session store. */
        }
        return memory.has(key) ? memory.get(key) : fallback;
    }

    function set(key, value) {
        const storedValue = String(value);
        memory.set(key, storedValue);
        try {
            localStorage.setItem(key, storedValue);
            return true;
        } catch (error) {
            return false;
        }
    }

    function remove(key) {
        memory.delete(key);
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            return false;
        }
    }

    /* Hidden developer switch (Konami code, see studio.js): read the firmware
       and app catalogs from the development branch instead of main, to check
       how a release will look before it is merged. */
    const DEV_CATALOG_KEY = "uvstudio.devCatalog";
    const DEV_CATALOG_BRANCH = "feature_update_v7";
    // Default to this project's own repository so the firmware catalog is sourced
    // from the archive/ folder committed here; setCatalogRepo() can override it.
    const DEFAULT_CATALOG_REPO = "oldlicn/Betula-Firmware-Flasher";
    const DEFAULT_CATALOG_ARCHIVE_PATH = "archive";
    const CATALOG_REPO_KEY = "uvstudio.catalogRepo";
    const CATALOG_ARCHIVE_PATH_KEY = "uvstudio.catalogArchivePath";

    function devCatalog() {
        return get(DEV_CATALOG_KEY, "") === "1";
    }

    function setDevCatalog(enabled) {
        return enabled ? set(DEV_CATALOG_KEY, "1") : remove(DEV_CATALOG_KEY);
    }

    function catalogBranch() {
        return devCatalog() ? DEV_CATALOG_BRANCH : "main";
    }

    // The firmware (and app) catalog normally lives in the public F4HWN repo, but
    // power users can point it at their own GitHub repository. Set the values once
    // via UVStudioPreferences.setCatalogRepo('owner/repo') / setCatalogArchivePath,
    // and they persist in localStorage. The code falls back to the public repo when
    // nothing is configured, so the default experience is unchanged.
    function catalogRepo() {
        return get(CATALOG_REPO_KEY, DEFAULT_CATALOG_REPO);
    }

    function setCatalogRepo(repo) {
        return set(CATALOG_REPO_KEY, repo);
    }

    function catalogArchivePath() {
        return get(CATALOG_ARCHIVE_PATH_KEY, DEFAULT_CATALOG_ARCHIVE_PATH);
    }

    function setCatalogArchivePath(path) {
        return set(CATALOG_ARCHIVE_PATH_KEY, path);
    }

    // A firmware manifest served from GitHub Pages is far faster and more reliable
    // than the api.github.com contents endpoint from some regions. The Pages base
    // URL is derived from the catalog repository (owner/repo -> owner.github.io/repo)
    // but can be overridden for custom domains.
    const CATALOG_PAGES_BASE_KEY = "uvstudio.catalogPagesBase";
    const CATALOG_MANIFEST_PATH_KEY = "uvstudio.catalogManifestPath";

    function derivePagesBase(repo) {
        const slash = String(repo || "").indexOf("/");
        if (slash <= 0) return "";
        const owner = repo.slice(0, slash);
        const name = repo.slice(slash + 1);
        return `https://${owner}.github.io/${name}`;
    }

    function catalogPagesBase() {
        return get(CATALOG_PAGES_BASE_KEY, derivePagesBase(catalogRepo()));
    }

    function setCatalogPagesBase(base) {
        return set(CATALOG_PAGES_BASE_KEY, base);
    }

    function catalogManifestPath() {
        return get(CATALOG_MANIFEST_PATH_KEY, "archive/catalog.json");
    }

    function setCatalogManifestPath(path) {
        return set(CATALOG_MANIFEST_PATH_KEY, path);
    }

    window.UVStudioPreferences = Object.freeze({
        get, set, remove, devCatalog, setDevCatalog, catalogBranch,
        catalogRepo, setCatalogRepo, catalogArchivePath, setCatalogArchivePath,
        catalogPagesBase, setCatalogPagesBase, catalogManifestPath, setCatalogManifestPath
    });
})();
