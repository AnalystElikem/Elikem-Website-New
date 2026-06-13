import { useState, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import useResponsive from "../hooks/useResponsive";
import DOMPurify from "dompurify";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { erpnextPublicOrigin } from "../config/erpnextPublic";

type BlogPost = {
  name: string;
  title: string;
  blog_category?: string;
  blogger?: string;
  route?: string;
  published_on?: string;
  featured?: boolean;
  blog_intro?: string;
  /** Rich text (HTML) from ERPNext */
  content?: string;
  meta_title?: string;
  meta_description?: string;
  meta_image?: string;
};

const ink = "#4b5a45";
const muted = "#8a867d";
const paper = "#f5f2eb";

export default function BlogDetail() {
  const { isMobile } = useResponsive();
  const { blogName } = useParams<{ blogName: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reads, setReads] = useState(0);

  useEffect(() => {
    const fetchPost = async () => {
      if (!blogName) {
        setError("We couldn’t find that article.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `/api/blog/${encodeURIComponent(blogName)}`,
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const reason =
            typeof data?.reason === "string" ? data.reason : "";
          setError(
            reason === "blog_post_not_found"
              ? "This article could not be found."
              : "We couldn’t load this article. Please try again later.",
          );
          setPost(null);
          return;
        }
        const loaded = data.post as BlogPost | null | undefined;
        if (!loaded?.name) {
          setError("This article could not be found.");
          setPost(null);
          return;
        }
        setPost(loaded);

        // Read-count API expects the internal document id, not the blog URL slug.
        const docName = encodeURIComponent(loaded.name);

        const readsRes = await fetch(`/api/blog/${docName}/reads`);
        if (readsRes.ok) {
          const readsData = await readsRes.json();
          setReads(readsData.reads || 0);
        }

        const sessionKey = `blog_read_${loaded.name}`;
        const alreadyRead = sessionStorage.getItem(sessionKey);

        if (!alreadyRead) {
          await fetch(`/api/blog/${docName}/reads`, { method: "POST" });
          sessionStorage.setItem(sessionKey, "true");
        }
      } catch (err) {
        setError("We couldn’t load this article. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [blogName]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    if (!erpnextPublicOrigin) {
      return imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
    }
    return `${erpnextPublicOrigin}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
  };

  const safeBodyHtml = useMemo(() => {
    const raw = post?.content?.trim();
    if (!raw) return "";
    return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } });
  }, [post?.content]);

  if (loading) {
    return (
      <div className="page-with-fixed-nav" style={{ background: paper, minHeight: "100vh" }}>
        <Navbar />
        <div
          style={{
            padding: "100px 24px",
            textAlign: "center",
            color: muted,
            fontFamily: "Inter, sans-serif",
          }}
        >
          Loading…
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="page-with-fixed-nav" style={{ background: paper, minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
        <Navbar />
        <div style={{ padding: "100px 24px", textAlign: "center" }}>
          <p style={{ fontSize: "16px", color: "#b54a4a", marginBottom: "24px" }}>
            {error || "This article could not be found."}
          </p>
          <Link
            to="/blog"
            className="link link-underline"
            style={{
              fontSize: "13px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: ink,
            }}
          >
            Back to blog
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const imageUrl = getImageUrl(post.meta_image);

  return (
    <div className="page-with-fixed-nav" style={{ background: paper, minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
      <Navbar />

      <article>
        <div
          style={{
            maxWidth: "720px",
            margin: "0 auto",
            padding: isMobile ? "28px 20px 0" : "44px 40px 0",
          }}
        >
          <Link
            to="/blog"
            className="link link-underline"
            style={{
              display: "inline-block",
              fontSize: "12px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: ink,
              marginBottom: "28px",
            }}
          >
            Blog
          </Link>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "6px 18px",
              fontSize: "12px",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: muted,
              marginBottom: "16px",
            }}
          >
            {post.published_on && <span>{formatDate(post.published_on)}</span>}
            {post.blog_category && (
              <span style={{ color: ink, fontWeight: 500 }}>{post.blog_category}</span>
            )}
            {post.blogger && <span>{post.blogger}</span>}
          </div>

          <h1
            style={{
              fontFamily: '"Playfair Display", serif',
              fontWeight: 400,
              fontSize: isMobile ? "20px" : "30px",
              lineHeight: 1.00,
              color: ink,
              margin: "0 0 20px",
              letterSpacing: "-0.02em",
            }}
          >
            {post.title}
          </h1>

          {post.blog_intro && (
            <p
              style={{
                fontSize: isMobile ? "17px" : "19px",
                lineHeight: 1.65,
                color: "#3d3d38",
                margin: "0 0 28px",
                fontWeight: 400,
                textAlign: "justify",
                hyphens: "auto",
              }}
            >
              {post.blog_intro}
            </p>
          )}
        </div>

        {imageUrl && (
          <div
            style={{
              maxWidth: "960px",
              margin: "0 auto 40px",
              padding: isMobile ? "0 20px" : "0 40px",
            }}
          >
            <div
              style={{
                borderRadius: "6px",
                overflow: "hidden",
                background: "#d9d6cf",
                maxHeight: isMobile ? "320px" : "440px",
              }}
            >
              <img
                src={imageUrl}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  maxHeight: isMobile ? "320px" : "440px",
                  objectFit: "cover",
                  display: "block",
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).closest("div")!.style.display = "none";
                }}
              />
            </div>
          </div>
        )}

        <div
          style={{
            maxWidth: "720px",
            margin: "0 auto",
            padding: isMobile ? "0 20px 80px" : "0 40px 100px",
          }}
        >
          {safeBodyHtml ? (
            <div
              className="blog-content blog-prose blog-prose--html"
              style={{
                fontSize: isMobile ? "16px" : "17px",
                lineHeight: 1.78,
                color: "#2a2a2a",
                wordBreak: "break-word",
                hyphens: "auto",
              }}
              dangerouslySetInnerHTML={{ __html: safeBodyHtml }}
            />
          ) : (
            <p style={{ color: muted }}>No article body for this post.</p>
          )}

          <footer
            style={{
              marginTop: "48px",
              paddingTop: "28px",
              borderTop: "1px solid #e0dcd4",
              fontSize: "13px",
              color: muted,
              lineHeight: 1.5,
            }}
          >
            {reads > 0 ? (
              <span>
                {reads.toLocaleString()} {reads === 1 ? "read" : "reads"}
                {" · "}
              </span>
            ) : null}
            <span>Thank you for reading.</span>
          </footer>
        </div>
      </article>

      <Footer />
    </div>
  );
}
