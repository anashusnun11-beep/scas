export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "scas-theme";

/** The app (dashboards, forms) defaults to light. Landing and login force dark locally. */
export const DEFAULT_THEME: Theme = "light";

/**
 * Runs before first paint (inlined in the root layout) so the saved theme is applied
 * without a flash of the wrong colours.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");document.documentElement.dataset.theme=t==="dark"||t==="light"?t:"${DEFAULT_THEME}"}catch(e){document.documentElement.dataset.theme="${DEFAULT_THEME}"}})();`;
