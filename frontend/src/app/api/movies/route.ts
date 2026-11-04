import { NextResponse } from "next/server";

export const revalidate = 1800; // 30-minute ISR cache

export interface MovieItem {
  id: string;
  title: string;
  year: number | string;
  category: "Hollywood" | "Bollywood" | "K-Drama" | "Anime" | "Free Classic" | "Worldwide";
  stars: string;
  rating?: string;
  image: string;
  description?: string;
  type?: string;
  trailerId?: string;
  watchLinks: {
    netflix?: string;
    prime?: string;
    disney?: string;
    apple?: string;
    max?: string;
    tubiFree?: string;
    youtubeFree?: string;
    justWatch: string;
    googleWatch: string;
  };
}

// Curated Worldwide Flagship Catalog for instant zero-latency loading
const CURATED_WORLDWIDE_CATALOG: MovieItem[] = [
  {
    id: "tt15239678",
    title: "Dune: Part Two",
    year: 2024,
    category: "Hollywood",
    stars: "Timothée Chalamet, Zendaya, Rebecca Ferguson",
    rating: "8.5 / 10 (IMDb)",
    image: "https://m.media-amazon.com/images/M/MV5BNTc0YmQxMjEtODI5MC00NjFiLTlkMWUtOGQ5NjFmYWUyZGJhXkEyXkFqcGc@._V1_.jpg",
    trailerId: "Way9Dexny3w",
    description: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
    watchLinks: {
      max: "https://play.max.com/search?q=Dune+Part+Two",
      prime: "https://www.amazon.com/s?k=Dune+Part+Two&i=instant-video",
      apple: "https://tv.apple.com/search?term=Dune+Part+Two",
      justWatch: "https://www.justwatch.com/us/movie/dune-part-two",
      googleWatch: "https://www.google.com/search?q=where+to+watch+Dune+Part+Two+online",
    },
  },
  {
    id: "tt15398776",
    title: "Oppenheimer",
    year: 2023,
    category: "Hollywood",
    stars: "Cillian Murphy, Emily Blunt, Matt Damon, Robert Downey Jr.",
    rating: "8.9 / 10 (Oscar Best Picture)",
    image: "https://m.media-amazon.com/images/M/MV5BMDBmYTZjNjctNDhlNy00N2EzLTk5ODgtZTIxMmY0ZWZlZDFkXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
    trailerId: "uYPbbksJxIg",
    description: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.",
    watchLinks: {
      prime: "https://www.amazon.com/s?k=Oppenheimer&i=instant-video",
      apple: "https://tv.apple.com/search?term=Oppenheimer",
      justWatch: "https://www.justwatch.com/us/movie/oppenheimer",
      googleWatch: "https://www.google.com/search?q=where+to+watch+Oppenheimer+online",
    },
  },
  {
    id: "tt15354916",
    title: "Jawan",
    year: 2023,
    category: "Bollywood",
    stars: "Shah Rukh Khan, Nayanthara, Vijay Sethupathi",
    rating: "7.0 / 10 (Record Box Office)",
    image: "https://m.media-amazon.com/images/M/MV5BMGExNGI1NDktOWI2Mi00NDM3LWIxMmQtNTQxYTgzMzI0MTA1XkEyXkFqcGc@._V1_.jpg",
    trailerId: "MWOlnZSnXJo",
    description: "A high-octane action thriller outlining the emotional journey of a prison warden driven by personal vendetta to rectify societal injustice.",
    watchLinks: {
      netflix: "https://www.netflix.com/search?q=Jawan",
      justWatch: "https://www.justwatch.com/us/movie/jawan",
      googleWatch: "https://www.google.com/search?q=where+to+watch+Jawan+online",
    },
  },
  {
    id: "tt10919420",
    title: "Squid Game",
    year: "2021-2024",
    category: "K-Drama",
    stars: "Lee Jung-jae, Park Hae-soo, Wi Ha-joon",
    rating: "8.0 / 10 (Global Phenomenon)",
    image: "https://m.media-amazon.com/images/M/MV5BYWE3MDVkN2EtNjQ5MS00ZDQ4LTliNzYtMjc2YWMzMDEwMTA3XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
    trailerId: "oqxAJKy0ii4",
    description: "Hundreds of cash-strapped players accept a strange invitation to compete in children's games with tempting prize and deadly high stakes.",
    watchLinks: {
      netflix: "https://www.netflix.com/search?q=Squid+Game",
      justWatch: "https://www.justwatch.com/us/tv-show/squid-game",
      googleWatch: "https://www.google.com/search?q=where+to+watch+Squid+Game+online",
    },
  },
  {
    id: "tt6751668",
    title: "Parasite",
    year: 2019,
    category: "K-Drama",
    stars: "Song Kang-ho, Lee Sun-kyun, Cho Yeo-jeong",
    rating: "8.5 / 10 (Oscar Best Picture)",
    image: "https://m.media-amazon.com/images/M/MV5BYWZjMjk3ZTItODQ2ZC00MGI5LWE0ZTItODg5ZThiYWM0ZDA4XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
    trailerId: "isOGD_7hNIY",
    description: "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.",
    watchLinks: {
      max: "https://play.max.com/search?q=Parasite",
      prime: "https://www.amazon.com/s?k=Parasite&i=instant-video",
      tubiFree: "https://tubitv.com/search/Parasite",
      justWatch: "https://www.justwatch.com/us/movie/parasite-2019",
      googleWatch: "https://www.google.com/search?q=where+to+watch+Parasite+online",
    },
  },
  {
    id: "tt8178634",
    title: "RRR",
    year: 2022,
    category: "Bollywood",
    stars: "N.T. Rama Rao Jr., Ram Charan, Ajay Devgn, Alia Bhatt",
    rating: "7.8 / 10 (Oscar Winner)",
    image: "https://m.media-amazon.com/images/M/MV5BODUwNDNjMTctODUxNy00ZTA2LWIyYTEtZjUwZmQ2NDBiNWFlXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
    trailerId: "GY4BgdUSpbE",
    description: "A fearless revolutionary and an officer in the British force come together to embark on an unbelievable journey of heroism.",
    watchLinks: {
      netflix: "https://www.netflix.com/search?q=RRR",
      justWatch: "https://www.justwatch.com/us/movie/rrr",
      googleWatch: "https://www.google.com/search?q=where+to+watch+RRR+online",
    },
  },
  {
    id: "tt0245429",
    title: "Spirited Away",
    year: 2001,
    category: "Anime",
    stars: "Rumi Hiiragi, Miyu Irino, Mari Natsuki",
    rating: "8.6 / 10 (Studio Ghibli Masterpiece)",
    image: "https://m.media-amazon.com/images/M/MV5BNTEyNmEwOWUtYzkyOC00ZTQ4LTllZmUtMjk0Y2Y5ZWU3Y2ExXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
    trailerId: "ByXuk9QqQkk",
    description: "During her family's move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits.",
    watchLinks: {
      max: "https://play.max.com/search?q=Spirited+Away",
      netflix: "https://www.netflix.com/search?q=Spirited+Away",
      justWatch: "https://www.justwatch.com/us/movie/spirited-away",
      googleWatch: "https://www.google.com/search?q=where+to+watch+Spirited+Away+online",
    },
  },
  {
    id: "tt6263850",
    title: "Deadpool & Wolverine",
    year: 2024,
    category: "Hollywood",
    stars: "Ryan Reynolds, Hugh Jackman, Emma Corrin",
    rating: "7.7 / 10 (Marvel Blockbuster)",
    image: "https://m.media-amazon.com/images/M/MV5BZTk5ODY0MmQtMzA3Ni00NGY1LThiYzItZThiNjFiNDM4MTM3XkEyXkFqcGc@._V1_.jpg",
    trailerId: "73_1biulkYk",
    description: "Wolverine is recovering from his injuries when he crosses paths with the loudmouth, Deadpool. They team up to defeat a common enemy.",
    watchLinks: {
      disney: "https://www.disneyplus.com/search?q=Deadpool+Wolverine",
      prime: "https://www.amazon.com/s?k=Deadpool+Wolverine&i=instant-video",
      apple: "https://tv.apple.com/search?term=Deadpool+Wolverine",
      justWatch: "https://www.justwatch.com/us/movie/deadpool-and-wolverine",
      googleWatch: "https://www.google.com/search?q=where+to+watch+Deadpool+and+Wolverine+online",
    },
  },
  {
    id: "tt0816692",
    title: "Interstellar",
    year: 2014,
    category: "Hollywood",
    stars: "Matthew McConaughey, Anne Hathaway, Jessica Chastain",
    rating: "8.7 / 10 (Sci-Fi Epic)",
    image: "https://m.media-amazon.com/images/M/MV5BYzdjMDAxZGItMjI2My00ODA1LTlkNzItOWFjMDU5ZDJlYWY3XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
    trailerId: "zSWdZVtXT7E",
    description: "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft through a wormhole.",
    watchLinks: {
      prime: "https://www.amazon.com/s?k=Interstellar&i=instant-video",
      apple: "https://tv.apple.com/search?term=Interstellar",
      justWatch: "https://www.justwatch.com/us/movie/interstellar",
      googleWatch: "https://www.google.com/search?q=where+to+watch+Interstellar+online",
    },
  },
  {
    id: "tt0063350",
    title: "Night of the Living Dead",
    year: 1968,
    category: "Free Classic",
    stars: "Duane Jones, Judith O'Dea, Karl Hardman",
    rating: "7.8 / 10 (Public Domain Legend)",
    image: "https://m.media-amazon.com/images/M/MV5BNDUyODAzNDgtZjhhMi00MThjLTlhNDgtNWZkZWFkMzgwNzE0XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
    trailerId: "5gUKVMJPmfU",
    description: "A ragtag group of Pennsylvanians barricade themselves in an old farmhouse to remain safe from a bloodthirsty, flesh-eating breed of monsters.",
    watchLinks: {
      youtubeFree: "https://www.youtube.com/results?search_query=Night+of+the+Living+Dead+1968+full+movie",
      tubiFree: "https://tubitv.com/search/Night+of+the+Living+Dead",
      justWatch: "https://www.justwatch.com/us/movie/night-of-the-living-dead",
      googleWatch: "https://www.google.com/search?q=where+to+watch+Night+of+the+Living+Dead+free+online",
    },
  },
  {
    id: "tt0027666",
    title: "Modern Times (Charlie Chaplin)",
    year: 1936,
    category: "Free Classic",
    stars: "Charles Chaplin, Paulette Goddard, Henry Bergman",
    rating: "8.5 / 10 (Cinema Masterpiece)",
    image: "https://m.media-amazon.com/images/M/MV5BYmRhYjc4MWQtMzZkZi00YmU3LWEzZWYtZWM4OGFiYWIwZDVjXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
    trailerId: "GLeDdzGUTq0",
    description: "The Tramp struggles to live in modern industrial society with the help of a young homeless woman. Legally free to stream online.",
    watchLinks: {
      youtubeFree: "https://www.youtube.com/results?search_query=Charlie+Chaplin+Modern+Times+full+movie",
      justWatch: "https://www.justwatch.com/us/movie/modern-times",
      googleWatch: "https://www.google.com/search?q=watch+Charlie+Chaplin+Modern+Times+free+online",
    },
  },
  {
    id: "tt11032374",
    title: "Demon Slayer: Mugen Train",
    year: 2020,
    category: "Anime",
    stars: "Natsuki Hanae, Akari Kito, Hiro Shimono",
    rating: "8.2 / 10 (Anime Box Office Record)",
    image: "https://m.media-amazon.com/images/M/MV5BNTI0NGVkY2MtZWZhMi00MDVlLWE1NDAtNmFlOWFlZTkxM2U4XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
    trailerId: "ATJYac_dORw",
    description: "After his family was brutally murdered and his sister turned into a demon, Tanjiro Kamado's journey as a demon slayer begins.",
    watchLinks: {
      netflix: "https://www.netflix.com/search?q=Demon+Slayer",
      justWatch: "https://www.justwatch.com/us/movie/demon-slayer-kimetsu-no-yaiba-the-movie-mugen-train",
      googleWatch: "https://www.google.com/search?q=where+to+watch+Demon+Slayer+Mugen+Train+online",
    },
  },
];

// Helper to build external streaming corridors for any movie
function buildWatchCorridors(title: string) {
  const enc = encodeURIComponent(title);
  return {
    netflix: `https://www.netflix.com/search?q=${enc}`,
    prime: `https://www.amazon.com/s?k=${enc}&i=instant-video`,
    disney: `https://www.disneyplus.com/search?q=${enc}`,
    apple: `https://tv.apple.com/search?term=${enc}`,
    max: `https://play.max.com/search?q=${enc}`,
    tubiFree: `https://tubitv.com/search/${enc}`,
    youtubeFree: `https://www.youtube.com/results?search_query=${enc}+full+movie`,
    justWatch: `https://www.justwatch.com/us/search?q=${enc}`,
    googleWatch: `https://www.google.com/search?q=where+to+watch+${enc}+online`,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "catalog";
  const query = searchParams.get("q") || "";
  const category = searchParams.get("category");

  // 1. Live Global Search (Hits IMDb Suggest API across millions of worldwide movies & series)
  if (action === "search" && query.trim().length > 0) {
    try {
      const cleanQ = query.trim().replace(/\s+/g, "_").toLowerCase();
      const firstChar = cleanQ[0] || "a";
      const imdbUrl = `https://v3.sg.media-imdb.com/suggestion/${firstChar}/${encodeURIComponent(cleanQ)}.json`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(imdbUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const rawItems = data.d || [];

        const movies: MovieItem[] = rawItems
          .filter((item: any) => item.l && item.id)
          .slice(0, 15)
          .map((item: any) => {
            const title = item.l;
            const year = item.y || "N/A";
            const stars = item.s || "Leading Global Cast";
            const img = item.i?.imageUrl || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80";

            return {
              id: item.id,
              title,
              year,
              category: "Worldwide",
              stars,
              image: img,
              type: item.q || "Feature Film",
              watchLinks: buildWatchCorridors(title),
            };
          });

        return NextResponse.json({
          success: true,
          query,
          count: movies.length,
          movies,
        });
      }
    } catch (err) {
      console.warn("IMDb Search API fallback:", err);
    }

    // Fallback: search in local catalog
    const filtered = CURATED_WORLDWIDE_CATALOG.filter((m) =>
      m.title.toLowerCase().includes(query.toLowerCase()) ||
      m.stars.toLowerCase().includes(query.toLowerCase())
    );

    return NextResponse.json({
      success: true,
      query,
      count: filtered.length,
      movies: filtered,
    });
  }

  // 2. Curated Catalog / By Category
  let results = [...CURATED_WORLDWIDE_CATALOG];
  if (category && category !== "All") {
    results = results.filter((m) => m.category.toLowerCase() === category.toLowerCase());
  }

  return NextResponse.json(
    {
      success: true,
      count: results.length,
      movies: results,
      categories: ["All", "Hollywood", "Bollywood", "K-Drama", "Anime", "Free Classic"],
      updated_at: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    }
  );
}

