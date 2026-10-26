export interface Article {
  id: number;
  title: string;
  slug: string;
  category: string;
  summary: string;
  content: string;
  source_url?: string | null;
  source_name?: string | null;
  image_url?: string | null;
  youtube_script?: string | null;
  video_path?: string | null;
  youtube_video_id?: string | null;
  author_name?: string | null;
  status: "DRAFT" | "VIDEO_READY" | "PUBLISHED";
  views: number;
  created_at: string;
  published_at?: string | null;
  video_status?: string | null;
  video_progress?: number | null;
  video_stage_text?: string | null;
  video_error?: string | null;
  video_eta?: string | null;
  video_updated_at?: string | null;
}

export interface AdminStats {
  total_articles: number;
  drafts_count: number;
  video_ready_count: number;
  published_count: number;
  total_views: number;
}

export interface ArticleListResponse {
  items: Article[];
  total: number;
  page: number;
  limit: number;
}

export interface ActionResponse {
  success: boolean;
  message: string;
  article?: Article;
}

export interface VideoProgressInfo {
  article_id: number;
  title: string;
  category: string;
  video_status: string;
  video_progress: number;
  video_stage_text: string;
  video_error?: string | null;
  video_eta?: string | null;
  youtube_video_id?: string | null;
  video_path?: string | null;
  updated_at?: string | null;
}

export interface WorkerStatusInfo {
  online: boolean;
  worker_name: string;
  status: string;
  last_seen?: string | null;
  active_article_id?: number | null;
  active_article_title?: string | null;
  channel_name: string;
  total_completed: number;
  shorts_today?: number;
  longs_today?: number;
  max_shorts?: number;
  max_longs?: number;
  daily_quota_status?: string;
}

export interface AnalyticsSourceStat {
  source: string;
  count: number;
  percent: number;
}

export interface AnalyticsCountryStat {
  country_code: string;
  country_name: string;
  flag: string;
  count: number;
  percent: number;
}

export interface AnalyticsTopArticle {
  id: number;
  title: string;
  slug: string;
  category: string;
  views: number;
}

export interface AnalyticsLiveVisit {
  id: number;
  path: string;
  article_title?: string | null;
  source: string;
  country_code: string;
  country_name: string;
  flag: string;
  device: string;
  time_ago: string;
}

export interface AnalyticsSummary {
  total_views: number;
  views_today: number;
  unique_visitors_today: number;
  mobile_percent: number;
  desktop_percent: number;
  top_source: string;
  top_country: string;
  sources: AnalyticsSourceStat[];
  countries: AnalyticsCountryStat[];
  top_articles: AnalyticsTopArticle[];
  recent_visits: AnalyticsLiveVisit[];
}

