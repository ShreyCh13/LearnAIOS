import { prisma } from '../../core/database';
import { VectorStore, Document, ScoredChunk } from './ragInterface';

export class PostgresKeywordRAG implements VectorStore {
  async addDocument(doc: Document): Promise<void> {
    // For now, we rely on the 'Page' table being the source of truth.
    // In a real vector implementation, we would store chunks in a separate table.
    // This implementation assumes 'doc' maps to a Prisma model we can query with LIKE.
    // For this MVP, this method might be a no-op if we query tables directly.
    // Or we can introduce a 'SearchIndex' table.
    return; 
  }

  async search(query: string, filters?: { courseId?: string }): Promise<ScoredChunk[]> {
    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3);

    if (keywords.length === 0) return [];

    // Prisma 'contains' query for pages
    const whereClause: any = {
      OR: keywords.map((kw) => ({
        bodyMarkdown: {
          contains: kw,
          mode: 'insensitive',
        },
      })),
    };

    if (filters?.courseId) {
      whereClause.courseId = filters.courseId;
    }

    const pages = await prisma.page.findMany({
      where: whereClause,
      take: 5,
      select: {
        id: true,
        title: true,
        bodyMarkdown: true,
      },
    });

    return pages.map((p) => ({
      id: p.id,
      content: p.bodyMarkdown,
      score: 1.0, // Dummy score for keyword match
      metadata: { title: p.title, type: 'Page' },
    }));
  }
}


