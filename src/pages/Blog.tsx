import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useResponsive from "../hooks/useResponsive";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

type BlogPost = {
  name: string;
  title: string;
  blog_category?: string;
  blogger?: string;
  route?: string;
  published_on?: string;
  featured?: boolean;
  blog_intro?: string;
  meta_image?: string;
};

const ink = "#4b5a45";
const muted = "#8a867d";
const paper = "#f5f2eb";

function getImageUrl(imagePath?: string) {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath;
  return `https://siamae.frappe.cloud${imagePath}`;
}

export default function Blog() {
  const { isMobile } = useResponsive();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postsRes, categoriesRes] = await Promise.all([
          fetch("/api/blog"),
          fetch("/api/blog/categories"),
        ]);

        if (!postsRes.ok) throw new Error("Failed to fetch blog posts");
        if (!categoriesRes.ok) throw new Error("Failed to fetch categories");

        const postsData = await postsRes.json();
        const categoriesData = await categoriesRes.json();

        setPosts(postsData.posts || []);
        setCategories(["All", ...(categoriesData.categories || [])]);
        setSelectedCategory("All");
      } catch (err) {
        setError("Failed to load blog data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredPosts =
    selectedCategory === "All"
      ? posts
      : posts.filter((post) => post.blog_category === selectedCategory);

  const featuredPost =
    selectedCategory === "All" && filteredPosts.length > 0
      ? filteredPosts.find((p) => p.featured) ?? filteredPosts[0]
      : null;

  const otherPosts = featuredPost
    ? filteredPosts.filter((p) => p.name !== featuredPost.name)
    : filteredPosts;

  const gridPosts = selectedCategory === "All" ? otherPosts : filteredPosts;

  if (loading) {
    return (
      <div
        style={{
          background: paper,
          minHeight: "100vh",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <Navbar />
        <hr className="blog-below-nav-divider" />
        <div
          style={{
            padding: "100px 24px",
            textAlign: "center",
            color: muted,
            fontSize: "15px",
          }}
        >
          Loading…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: paper, minHeight: "100vh" }}>
        <Navbar />
        <hr className="blog-below-nav-divider" />
        <div style={{ padding: "100px 24px", textAlign: "center", color: "#b54a4a" }}>
          {error}
        </div>
        <Footer />
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div style={{ background: paper, minHeight: "100vh" }}>
        <Navbar />
        <hr className="blog-below-nav-divider" />
        <div style={{ padding: "100px 24px", textAlign: "center", color: muted }}>
          Nothing published yet. Check back soon.
        </div>
        <Footer />
      </div>
    );
  }

  const ledeImage = featuredPost ? getImageUrl(featuredPost.meta_image) : null;

  return (
    <div
      style={{
        background: paper,
        minHeight: "100vh",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <Navbar />
      <hr className="blog-below-nav-divider" />

      <header
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          padding: isMobile ? "20px 20px 16px" : "28px 40px 20px",
        }}
      >
        <h1
          style={{
            fontFamily: '"Playfair Display", serif',
            fontWeight: 400,
            fontSize: isMobile ? "36px" : "48px",
            lineHeight: 1.15,
            color: ink,
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          Essays &amp; notes
        </h1>
        <p
          style={{
            margin: "16px 0 0",
            maxWidth: "520px",
            fontSize: isMobile ? "15px" : "16px",
            lineHeight: 1.65,
            color: "#5c5a54",
            textAlign: "justify",
            hyphens: "auto",
          }}
        >
          Longer-form writing on faith, data, and leadership—same voice as the rest of the site,
          in one place.
        </p>
      </header>

      {/* Categories */}
      <nav
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          padding: isMobile ? "0 20px 28px" : "0 40px 40px",
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
        aria-label="Blog categories"
      >
        {categories.map((category) => {
          const active = selectedCategory === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              style={{
                padding: "8px 14px",
                borderRadius: "999px",
                border: active ? `1px solid ${ink}` : "1px solid #dcd8cf",
                background: active ? ink : "transparent",
                color: active ? "#faf9f6" : ink,
                fontSize: "12px",
                fontWeight: 500,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "background 0.2s, color 0.2s, border-color 0.2s",
              }}
            >
              {category}
            </button>
          );
        })}
      </nav>

      {filteredPosts.length === 0 && (
        <div style={{ padding: "64px 24px", textAlign: "center", color: muted }}>
          No posts in this category yet.
        </div>
      )}

      {/* Lede — only on “All” */}
      {featuredPost && selectedCategory === "All" && (
        <section
          style={{
            maxWidth: "1120px",
            margin: "0 auto 48px",
            padding: isMobile ? "0 20px" : "0 40px",
          }}
        >
          <h2
            style={{
              fontFamily: '"Playfair Display", serif',
              fontWeight: 400,
              fontSize: isMobile ? "22px" : "26px",
              color: ink,
              margin: "0 0 20px",
            }}
          >
            Latest
          </h2>
          <Link
            to={`/blog/${featuredPost.name}`}
            className="blog-index-card"
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1.15fr 1fr",
              gap: 0,
            }}
          >
            <div className="blog-index-thumb" style={{ minHeight: isMobile ? "200px" : "260px" }}>
              {ledeImage ? (
                <img src={ledeImage} alt="" />
              ) : (
                <div style={{ width: "100%", height: "100%", minHeight: "200px" }} />
              )}
            </div>
            <div
              style={{
                padding: isMobile ? "28px 22px" : "40px 36px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                borderLeft: isMobile ? "none" : "1px solid #e4e1da",
                borderTop: isMobile ? "1px solid #e4e1da" : "none",
              }}
            >
              {featuredPost.blog_category && (
                <span
                  style={{
                    fontSize: "11px",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: muted,
                    marginBottom: "12px",
                  }}
                >
                  {featuredPost.blog_category}
                </span>
              )}
              <h2
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: isMobile ? "26px" : "34px",
                  fontWeight: 500,
                  lineHeight: 1.25,
                  color: ink,
                  margin: "0 0 16px",
                }}
              >
                {featuredPost.title}
              </h2>
              {featuredPost.blog_intro && (
                <p
                  style={{
                    margin: "0 0 20px",
                    fontSize: "15px",
                    lineHeight: 1.65,
                    color: "#5c5a54",
                    textAlign: "justify",
                    hyphens: "auto",
                  }}
                >
                  {featuredPost.blog_intro}
                </p>
              )}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "12px 20px",
                  fontSize: "13px",
                  color: muted,
                }}
              >
                {featuredPost.published_on && <span>{formatDate(featuredPost.published_on)}</span>}
                {featuredPost.blogger && <span>{featuredPost.blogger}</span>}
              </div>
            </div>
          </Link>
        </section>
      )}

      {gridPosts.length > 0 && (
        <section
          style={{
            maxWidth: "1120px",
            margin: "0 auto",
            padding: isMobile ? "0 20px 72px" : "0 40px 96px",
          }}
        >
          <h2
            style={{
              fontFamily: '"Playfair Display", serif',
              fontWeight: 400,
              fontSize: isMobile ? "22px" : "26px",
              color: ink,
              margin: "0 0 28px",
            }}
          >
            {selectedCategory === "All" ? "Older" : selectedCategory}
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
              gap: isMobile ? "20px" : "28px",
            }}
          >
            {gridPosts.map((post) => {
              const postImage = getImageUrl(post.meta_image);
              return (
                <Link key={post.name} to={`/blog/${post.name}`} className="blog-index-card">
                  <div className="blog-index-thumb">
                    {postImage ? (
                      <img src={postImage} alt="" />
                    ) : (
                      <div style={{ width: "100%", height: "100%", minHeight: "140px" }} />
                    )}
                  </div>
                  <div style={{ padding: "22px 22px 26px" }}>
                    {post.blog_category && (
                      <span
                        style={{
                          fontSize: "10px",
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          color: muted,
                          display: "block",
                          marginBottom: "10px",
                        }}
                      >
                        {post.blog_category}
                      </span>
                    )}
                    <h3
                      style={{
                        fontFamily: '"Playfair Display", serif',
                        fontSize: isMobile ? "20px" : "22px",
                        fontWeight: 500,
                        lineHeight: 1.3,
                        color: ink,
                        margin: "0 0 10px",
                      }}
                    >
                      {post.title}
                    </h3>
                    {post.blog_intro && (
                      <p
                        style={{
                          fontSize: "14px",
                          lineHeight: 1.6,
                          color: "#5c5a54",
                          margin: "0 0 16px",
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          textAlign: "justify",
                          hyphens: "auto",
                        }}
                      >
                        {post.blog_intro}
                      </p>
                    )}
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "8px 16px",
                        fontSize: "12px",
                        color: muted,
                      }}
                    >
                      {post.published_on && <span>{formatDate(post.published_on)}</span>}
                      {post.blogger && <span>{post.blogger}</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
