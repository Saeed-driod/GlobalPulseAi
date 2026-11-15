/**
 * GlobalPulse AI - Centralized Adsterra & Multi-Network Ad Configuration
 * 
 * -----------------------------------------------------------------------------------
 * INSTRUCTIONS:
 * 1. Generate your Adsterra ad codes at https://publishers.adsterra.com/
 * 2. Paste your 32-character zone keys or URLs into the configuration keys below.
 * 3. Save the file. The <AdUnit /> component will immediately start serving real ads.
 * 4. If a key is left empty (""), the ad slot will stay collapsed with ZERO blank boxes.
 * -----------------------------------------------------------------------------------
 */

export const ADS_CONFIG = {
  // Master Switch: Set to false to disable all ad units across the site immediately
  ENABLE_ADS: true,

  // 1. TOP LEADERBOARD BANNER (728x90 Desktop / 320x50 Mobile)
  // Placement: Directly below top market ticker / navigation bar on Homepage and Article pages
  // Format: Adsterra 728x90 or 320x50 banner
  // ---> PASTE YOUR 728x90 ZONE KEY HERE (e.g. "a1b2c3d4e5f678901234567890abcdef") <---
  TOP_LEADERBOARD_728x90_KEY: "",

  // 2. IN-FEED NATIVE RECOMMENDATION BANNER
  // Placement: Automatically injected in the Latest News feed after every 6th news card
  // Format: Adsterra Native Banner (e.g. container id like "container-a1b2c3d4e5" & invoke key)
  // ---> PASTE YOUR IN-FEED NATIVE BANNER KEY HERE <---
  IN_FEED_NATIVE_KEY: "",

  // ---> PASTE YOUR IN-FEED NATIVE BANNER CONTAINER ID HERE (e.g. "container-a1b2c3d4e5") <---
  IN_FEED_NATIVE_CONTAINER_ID: "",

  // 3. 300x250 MEDIUM RECTANGLE BANNER
  // Placement: Article Detail right sidebar & AI News Analyst intelligence section
  // Format: Adsterra 300x250 banner
  // ---> PASTE YOUR 300x250 RECTANGLE ZONE KEY HERE <---
  ARTICLE_MODAL_300x250_KEY: "",

  // 4. SOCIAL BAR / IN-PAGE PUSH SCRIPT URL
  // Placement: Injected globally in the root layout for high-CPM mobile & desktop alerts
  // Format: Full script URL from Adsterra (e.g. "//pl12345678.highperformanceformat.com/...")
  // ---> PASTE YOUR SOCIAL BAR SCRIPT URL HERE <---
  SOCIAL_BAR_SCRIPT_URL: "",
};

// Direct export aliases for flexible importing
export const TOP_LEADERBOARD_728x90_KEY = ADS_CONFIG.TOP_LEADERBOARD_728x90_KEY;
export const IN_FEED_NATIVE_KEY = ADS_CONFIG.IN_FEED_NATIVE_KEY;
export const IN_FEED_NATIVE_CONTAINER_ID = ADS_CONFIG.IN_FEED_NATIVE_CONTAINER_ID;
export const ARTICLE_MODAL_300x250_KEY = ADS_CONFIG.ARTICLE_MODAL_300x250_KEY;
export const SOCIAL_BAR_SCRIPT_URL = ADS_CONFIG.SOCIAL_BAR_SCRIPT_URL;
export const ENABLE_ADS = ADS_CONFIG.ENABLE_ADS;

export default ADS_CONFIG;

