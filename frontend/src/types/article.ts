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
}

