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
