/**
 * GlobalPulse AI - Centralized Adsterra & Multi-Network Ad Configuration
 * 
 * -----------------------------------------------------------------------------------
 * EXACT ACTIVE KEYS & PLACEMENTS
 * -----------------------------------------------------------------------------------
 */

export const ADS_CONFIG = {
  // Master Switch: Set to false to disable all ad units across the site immediately
  ENABLE_ADS: true,

  // 1. ADSTERRA 300x250 BANNER (In-Feed & Article Modal)
  // Key & Script for in-feed (after every 6th news card) and inside article reading view
  ARTICLE_MODAL_300x250_KEY: "f7126291d68f9df3872005cf005de9aa",
  ARTICLE_MODAL_300x250_SCRIPT_URL: "https://bauval.org/22/f7126291d68f9df3872005cf005de9aa",

  // 2. TOP LEADERBOARD BANNER (728x90 Desktop / 320x50 Mobile)
  // Placement: Below top market ticker / navigation bar
  TOP_LEADERBOARD_728x90_KEY: "",
  TOP_LEADERBOARD_SCRIPT_URL: "",

  // 3. SOCIAL BAR / IN-PAGE PUSH SCRIPT URL
  // Placement: Injected once globally with window.__adsInitialized guard
  SOCIAL_BAR_SCRIPT_URL: "",

  // Legacy Native aliases
  IN_FEED_NATIVE_KEY: "f7126291d68f9df3872005cf005de9aa",
  IN_FEED_NATIVE_CONTAINER_ID: "container-f7126291d68f9df3872005cf005de9aa",
};

export const ARTICLE_MODAL_300x250_KEY = ADS_CONFIG.ARTICLE_MODAL_300x250_KEY;
export const ARTICLE_MODAL_300x250_SCRIPT_URL = ADS_CONFIG.ARTICLE_MODAL_300x250_SCRIPT_URL;
export const TOP_LEADERBOARD_728x90_KEY = ADS_CONFIG.TOP_LEADERBOARD_728x90_KEY;
export const SOCIAL_BAR_SCRIPT_URL = ADS_CONFIG.SOCIAL_BAR_SCRIPT_URL;
export const IN_FEED_NATIVE_KEY = ADS_CONFIG.IN_FEED_NATIVE_KEY;
export const IN_FEED_NATIVE_CONTAINER_ID = ADS_CONFIG.IN_FEED_NATIVE_CONTAINER_ID;
export const ENABLE_ADS = ADS_CONFIG.ENABLE_ADS;

export default ADS_CONFIG;
