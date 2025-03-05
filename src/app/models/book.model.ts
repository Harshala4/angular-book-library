export interface BookCategory {
  name: string;
}

export interface CategoryResponse {
  subjects: BookCategory[];
}

export interface OpenLibraryResponse {
  docs: any[]; // ✅ Ensures 'docs' exists and is an array
}
