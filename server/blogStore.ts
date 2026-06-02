import { listERPNextDocuments, getERPNextDocument } from "./erpnextAuth.js";

export type BlogPost = {
  name: string;
  title: string;
  blog_category?: string;
  blogger?: string;
  route?: string;
  published_on?: string;
  featured?: boolean;
  blog_intro?: string;
  content_md?: string;
  meta_title?: string;
  meta_description?: string;
  meta_image?: string;
};

/**
 * Get all published blog posts
 */
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  try {
    // Fetch all blog posts (including drafts for now)
    // In production, filter by { docstatus: 1 } for published only
    const result = await listERPNextDocuments(
      "Blog Post",
      {}, // Empty filter to get all posts
      [
        "name",
        "title",
        "blog_category",
        "blogger",
        "route",
        "published_on",
        "featured",
        "blog_intro",
        "content_md",
        "meta_title",
        "meta_description",
        "meta_image",
      ]
    );

    console.log("[Blog Store] Fetched posts:", result);

    const posts: BlogPost[] = [];
    if (result.data && Array.isArray(result.data)) {
      for (const doc of result.data) {
        const data = doc as any;
        posts.push({
          name: data.name || "",
          title: data.title || "",
          blog_category: data.blog_category || undefined,
          blogger: data.blogger || undefined,
          route: data.route || undefined,
          published_on: data.published_on || undefined,
          featured: data.featured || false,
          blog_intro: data.blog_intro || undefined,
          content_md: data.content_md || undefined,
          meta_title: data.meta_title || undefined,
          meta_description: data.meta_description || undefined,
          meta_image: data.meta_image || undefined,
        });
      }
    }

    // Sort by published_on date descending
    posts.sort((a, b) => {
      const dateA = new Date(a.published_on || 0).getTime();
      const dateB = new Date(b.published_on || 0).getTime();
      return dateB - dateA;
    });

    console.log("[Blog Store] Processed posts:", posts);
    return posts;
  } catch (error) {
    console.error("Failed to get blog posts from ERPNext:", error);
    throw error;
  }
}

/**
 * Get all blog categories from published posts
 */
export async function getBlogCategories(): Promise<string[]> {
  try {
    const allPosts = await getAllBlogPosts();
    
    // Extract unique categories
    const categoriesSet = new Set<string>();
    for (const post of allPosts) {
      if (post.blog_category) {
        categoriesSet.add(post.blog_category);
      }
    }
    
    // Convert to array and sort alphabetically
    const categories = Array.from(categoriesSet).sort();
    console.log("[Blog Store] Available categories:", categories);
    return categories;
  } catch (error) {
    console.error("Failed to get blog categories:", error);
    throw error;
  }
}

/**
 * Get a single blog post by name/slug
 */
export async function getBlogPostByRoute(blogName: string): Promise<BlogPost | null> {
  try {
    const allPosts = await getAllBlogPosts();
    console.log("[Blog Store] Looking for blog name:", blogName);
    
    // Simple lookup by blog name
    const post = allPosts.find((p) => p.name === blogName);
    
    console.log("[Blog Store] Found post:", post);
    return post || null;
  } catch (error) {
    console.error("Failed to get blog post:", error);
    throw error;
  }
}

/**
 * Get featured blog posts
 */
export async function getFeaturedBlogPosts(limit = 3): Promise<BlogPost[]> {
  try {
    const allPosts = await getAllBlogPosts();
    return allPosts.filter((p) => p.featured).slice(0, limit);
  } catch (error) {
    console.error("Failed to get featured blog posts:", error);
    throw error;
  }
}

/**
 * Get blog posts by category
 */
export async function getBlogPostsByCategory(
  category: string
): Promise<BlogPost[]> {
  try {
    const allPosts = await getAllBlogPosts();
    return allPosts.filter((p) => p.blog_category === category);
  } catch (error) {
    console.error("Failed to get blog posts by category:", error);
    throw error;
  }
}
