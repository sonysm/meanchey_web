"use server";

export async function getCompanyCategories() {
  const API_BASE_URL = process.env.MEANCHEY_API_BASE_URL;
  if (!API_BASE_URL) return [];
  
  try {
    const url = new URL("/com/categories", API_BASE_URL);
    const response = await fetch(url.toString(), {
      method: "POST", // meanchey api defaults to POST mostly, or we can try GET
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
      next: { revalidate: 60 }
    });
    
    // Fallback to GET if POST fails? Let's assume GET or POST works. I'll just use POST.
    const result = await response.json();
    // Assuming result structure is { data: [...] } or just [...]
    return (result.data || result) as { id: string | number, title: string }[];
  } catch (err) {
    console.error("Error fetching categories:", err);
    return [];
  }
}
