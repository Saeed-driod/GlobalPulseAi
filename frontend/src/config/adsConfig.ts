/**
 * GlobalPulse AI - Centralized Adsterra & Multi-Network Ad Configuration (TypeScript)
 */

export interface AdsConfigInterface {
  ENABLE_ADS: boolean;
  TOP_LEADERBOARD_728x90_KEY: string;
  IN_FEED_NATIVE_KEY: string;
  IN_FEED_NATIVE_CONTAINER_ID: string;
  ARTICLE_MODAL_300x250_KEY: string;
  SOCIAL_BAR_SCRIPT_URL: string;
}

export const ADS_CONFIG: AdsConfigInterface = {
  ENABLE_ADS: true,

  // 1. TOP LEADERBOARD BANNER (728x90 Desktop / 320x50 Mobile)
  // Placement: Directly below top market ticker / navigation bar on Homepage and Article pages
  // ---> LINE 19: PASTE YOUR 728x90 ZONE KEY HERE <---
  TOP_LEADERBOARD_728x90_KEY: "",

  // 2. IN-FEED NATIVE RECOMMENDATION BANNER
  // Placement: Injected automatically in Latest News feed after every 6th card
  // ---> LINE 24: PASTE YOUR IN-FEED NATIVE BANNER KEY HERE <---
  IN_FEED_NATIVE_KEY: "",

  // ---> LINE 27: PASTE YOUR IN-FEED NATIVE CONTAINER ID HERE (e.g. "container-XXXXX") <---
  IN_FEED_NATIVE_CONTAINER_ID: "",

  // 3. 300x250 MEDIUM RECTANGLE BANNER
  // Placement: Article Detail right sidebar & AI News Analyst intelligence section
  // ---> LINE 32: PASTE YOUR 300x250 RECTANGLE ZONE KEY HERE <---
  ARTICLE_MODAL_300x250_KEY: "",

  // 4. SOCIAL BAR / IN-PAGE PUSH SCRIPT URL
  // Placement: Injected globally in root layout for high-CPM mobile & desktop alerts
  // ---> LINE 37: PASTE YOUR SOCIAL BAR SCRIPT URL HERE <---
  SOCIAL_BAR_SCRIPT_URL: "",
};

export const TOP_LEADERBOARD_728x90_KEY = ADS_CONFIG.TOP_LEADERBOARD_728x90_KEY;
export const IN_FEED_NATIVE_KEY = ADS_CONFIG.IN_FEED_NATIVE_KEY;
export const IN_FEED_NATIVE_CONTAINER_ID = ADS_CONFIG.IN_FEED_NATIVE_CONTAINER_ID;
export const ARTICLE_MODAL_300x250_KEY = ADS_CONFIG.ARTICLE_MODAL_300x250_KEY;
export const SOCIAL_BAR_SCRIPT_URL = ADS_CONFIG.SOCIAL_BAR_SCRIPT_URL;
export const ENABLE_ADS = ADS_CONFIG.ENABLE_ADS;

export default ADS_CONFIG;

