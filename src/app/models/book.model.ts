export interface BookCategory {
  name: string;
}

export interface CategoryResponse {
  subjects: BookCategory[];
}

// export interface OpenLibraryResponse {
//   docs: any[]; // ✅ Ensures 'docs' exists and is an array
// }

export interface BookDoc {
  author_key?: string[];
  author_name?: string[];
  first_publish_year?: number;
  title: string;
  subtitle?: string;
  inventoryStatus?: string; // Add this line
  category?:string;
}

export interface BookApiResponse {
  numFound: number;
  start: number;
  docs: BookDoc[];  // 'docs' is an array of Book
}