import { makeERPNextRequest } from "./erpnextAuth.js";

/**
 * Increment read count for a blog post
 * Stores read count in a custom field or metadata
 */
export async function incrementBlogReads(blogPostName: string): Promise<number> {
  try {
    // Get current post
    const post = await makeERPNextRequest(`/Blog Post/${blogPostName}?fields=["custom_reads"]`);
    const data = (post as any).data;
    
    const rawValue = data?.custom_reads;
    
    // Force convert to number
    let currentReads: number = 0;
    if (rawValue !== null && rawValue !== undefined && rawValue !== '') {
      const temp = String(rawValue).trim();
      const parsed = parseInt(temp, 10);
      
      if (!isNaN(parsed)) {
        currentReads = parsed;
      }
    }
    
    // Calculate new value
    const newReads = currentReads + 1;

    // Prepare update
    const updateData = {
      custom_reads: newReads,
    };

    // Send update
    await makeERPNextRequest(`/Blog Post/${blogPostName}`, {
      method: "PUT",
      body: updateData,
    });

    return newReads;
  } catch (error) {
    console.error("[Blog Store] ERROR in incrementBlogReads:", error);
    return 0;
  }
}

/**
 * Get read count for a blog post
 */
export async function getBlogReads(blogPostName: string): Promise<number> {
  try {
    const result = await makeERPNextRequest(`/Blog Post/${blogPostName}?fields=["custom_reads"]`);
    const rawValue = (result as any).data?.custom_reads;
    
    if (rawValue === null || rawValue === undefined || rawValue === '') {
      return 0;
    }
    
    // Convert to string and parse
    const stringValue = String(rawValue).trim();
    const parsed = parseInt(stringValue, 10);
    
    if (isNaN(parsed)) {
      return 0;
    }
    
    return parsed;
  } catch (error) {
    console.error("[Blog Store] GET READS - Error:", error);
    return 0;
  }
}
