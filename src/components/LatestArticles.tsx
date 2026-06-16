import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useResponsive from "../hooks/useResponsive";
import { erpnextPublicOrigin } from "../config/erpnextPublic";

type BlogPostApi = {
  name: string;
  title: string;
  blog_category?: string;
  published_on?: string;
  blog_intro?: string;
  meta_image?: string;
};

type CardPost = {
  slug: string;
  title: string;
  category: string;
  date: string;
  excerpt: string;
  image: string;
};

function getImageUrl(imagePath?: string) {
  if (!imagePath) return "";
  if (imagePath.startsWith("http")) return imagePath;
  if (!erpnextPublicOrigin) {
    return imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  }
  return `${erpnextPublicOrigin}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
}

function formatDate(dateString?: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** ERPNext `blog_intro` may be HTML; normalize to plain text for card previews. */
function blogIntroToPreviewPlain(intro: string | undefined): string {
  const raw = (intro || "").trim();
  if (!raw) return "";
  if (typeof document === "undefined") {
    return raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }
  const d = document.createElement("div");
  d.innerHTML = raw;
  return (d.textContent || "").replace(/\s+/g, " ").trim();
}

export default function LatestArticles() {
  const { isMobile } = useResponsive();
  const [posts, setPosts] = useState<CardPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/blog");
        const data = await response.json();
        const raw: BlogPostApi[] = Array.isArray(data.posts) ? data.posts : [];
        const three = raw.slice(0, 3).map((p) => {
          const img = getImageUrl(p.meta_image);
          return {
            slug: p.name,
            title: p.title || p.name,
            category: p.blog_category || "Blog",
            date: formatDate(p.published_on) || "Recent",
            excerpt:
              blogIntroToPreviewPlain(p.blog_intro) || "Read more on the blog.",
            image: img || "",
          };
        });
        if (!cancelled) setPosts(three);
      } catch (error) {
        console.error("Failed to fetch blog posts:", error);
        if (!cancelled) setPosts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const viewAllLink = (
    <Link
      to="/blog"
      className="link link-underline"
      style={{
        fontFamily: "Inter, sans-serif",
        fontSize: "13px",
        letterSpacing: "1.2px",
        textTransform: "uppercase",
        color: "#4b5a45",
        textDecoration: "none",
      }}
    >
      View All
    </Link>
  );

  return (
    <div
      style={{
        padding: isMobile ? "80px 20px" : "100px 40px",
        background: "#f5f2eb",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2
          style={{
            fontFamily: "Playfair Display, serif",
            fontWeight: 500,
            fontSize: isMobile ? "28px" : "40px",
            color: "#4b5a45",
          }}
        >
          Latest Thoughts
        </h2>

        {!isMobile && viewAllLink}
      </div>

      {loading ? (
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            textAlign: "center",
            padding: "40px 20px",
            color: "#8a867d",
          }}
        >
          <p>Loading…</p>
        </div>
      ) : posts.length === 0 ? (
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            textAlign: "center",
            padding: "24px 20px 8px",
            color: "#8a867d",
            fontFamily: "Inter, sans-serif",
            fontSize: "15px",
          }}
        >
          <p style={{ marginBottom: "12px" }}>No blog posts loaded yet.</p>
          <Link
            to="/blog"
            className="link link-underline"
            style={{ color: "#4b5a45", fontSize: "14px" }}
          >
            Open the blog
          </Link>
        </div>
      ) : (
        <div
          className="writing-grid"
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            gap: isMobile ? "24px" : "32px",
          }}
        >
          {posts.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              style={{
                textDecoration: "none",
                color: "inherit",
                display: "block",
                cursor: "pointer",
                transition: "transform 0.3s ease",
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  const img = e.currentTarget.querySelector(
                    ".post-image"
                  ) as HTMLImageElement | null;
                  const title = e.currentTarget.querySelector(
                    ".post-title"
                  ) as HTMLHeadingElement | null;
                  if (img) img.style.transform = "scale(1.08)";
                  if (title) title.style.transform = "translateY(-4px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  const img = e.currentTarget.querySelector(
                    ".post-image"
                  ) as HTMLImageElement | null;
                  const title = e.currentTarget.querySelector(
                    ".post-title"
                  ) as HTMLHeadingElement | null;
                  if (img) img.style.transform = "scale(1)";
                  if (title) title.style.transform = "translateY(0)";
                }
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "220px",
                  background: "#d9d6cf",
                  marginBottom: "14px",
                  overflow: "hidden",
                }}
              >
                {post.image ? (
                  <img
                    className="post-image"
                    src={post.image}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform 0.5s ease",
                    }}
                  />
                ) : (
                  <div
                    className="post-image"
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "Playfair Display, serif",
                      fontSize: "22px",
                      color: "#8a867d",
                      transition: "transform 0.5s ease",
                    }}
                  >
                    {post.title.slice(0, 1)}
                  </div>
                )}
              </div>

              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "11px",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  color: "#8a867d",
                  marginBottom: "6px",
                  fontWeight: 500,
                }}
              >
                {post.category} • {post.date}
              </p>

              <h3
                className="post-title"
                style={{
                  fontFamily: "Playfair Display, serif",
                  fontSize: isMobile ? "16px" : "17px",
                  color: "#4b5a45",
                  marginBottom: "8px",
                  lineHeight: 1.35,
                  transition: "transform 0.3s ease",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {post.title}
              </h3>

              <p
                className="post-excerpt"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: isMobile ? "14px" : "15px",
                  fontWeight: 400,
                  color: "#6f6f6f",
                  lineHeight: 1.6,
                  textAlign: "justify",
                  hyphens: "auto",
                }}
              >
                {post.excerpt}
              </p>
            </Link>
          ))}
        </div>
      )}

      {isMobile && (
        <div style={{ textAlign: "center", marginTop: "30px" }}>{viewAllLink}</div>
      )}
    </div>
  );
}
