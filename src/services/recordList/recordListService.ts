// RecordListService.ts
import { apiClient } from '../../services/api/client';
import type { Article, Book, Monograph, Norm, Patent, Software, Thesis, Encounter, Prize ,Record } from '../../types/recordList/types';

const endpointsMap = {
  articulo: { endpoint: '/articles/', idField: 'id_article' as const, type: 'articulo' as const },
  libro: { endpoint: '/books/', idField: 'id_book' as const, type: 'libro' as const },
  monografia: { endpoint: '/monographs/', idField: 'id_monograph' as const, type: 'monografia' as const },
  norma: { endpoint: '/norms/', idField: 'id_norm' as const, type: 'norma' as const },
  patente: { endpoint: '/patents/', idField: 'id_patent' as const, type: 'patente' as const },
  software: { endpoint: '/softwares/', idField: 'id_software' as const, type: 'software' as const },
  tesis: { endpoint: '/theses/', idField: 'id_thesis' as const, type: 'tesis' as const },
  evento: { endpoint: '/encounters/', idField: 'id_encounter' as const, type: 'evento' as const },
  premio: { endpoint: '/prizes/', idField: 'id_prize' as const, type: 'premio' as const },
} as const;

export const RecordListService = {
  async deleteRecord(recordId: string,type:string){
    
  },
  async fetchRecordsByAuthor(authorId: number): Promise<Record[]> {
    const allRecords: Record[] = [];

    // Iteramos con for...of y await para mejor control
    for (const [key, config] of Object.entries(endpointsMap)) {
      try {
        const response = await apiClient.get<any>(config.endpoint, {
          params: { author_id: authorId },
        });

        const items = response.data;
        for (const item of items) {
          const baseRecord = {
            id: item[config.idField],
            title: item.title,
            keywords: item.keywords ?? null,
            resume: item.resume ?? null,
            month_only: item.month_only ?? 1,
            year_only: item.year_only ?? 2009,
            id_country: item.id_country ?? null,
            id_project: item.id_project ?? null,
            id_group: item.id_group ?? null,
            authors: item.authors || [],
            country: item.country ?? null,
            tipo: config.type,
          };

          let record: Record;
          switch (config.type) {
            case 'articulo':
              record = {
                ...baseRecord,
                journal: item.journal,
                voulume: item.voulume,
                pages: item.pages,
                number: item.number ?? null,
                doi: item.doi ?? null,
                issn: item.issn ?? null,
                published: item.published ?? true,
                article_type: item.article_type,
              } as Article;
              break;
            case 'libro':
              record = {
                ...baseRecord,
                chapter_title: item.chapter_title,
                editor: item.editor ?? null,
                voulume: item.voulume ?? null,
                number: item.number ?? null,
                series: item.series ?? null,
                pages: item.pages ?? null,
                publisher: item.publisher ?? null,
                isbn: item.isbn ?? null,
                is_chapter: item.is_chapter ?? false,
              } as Book;
              break;
            case 'monografia':
              record = {
                ...baseRecord,
                isbn: item.isbn,
                pages: item.pages,
                number: item.number ?? null,
                month: item.month ?? null,
                cenda: item.cenda ?? null,
              }as Monograph;
              break;
            case 'norma':
              record = {
                ...baseRecord,
                registration_number: item.registration_number,
                pages: item.pages,
                norm_type: item.norm_type,
              } as Norm;
              break;
            case 'patente':
              record = {
                ...baseRecord,
                reg_number: item.reg_number,
                yearfiled: item.yearfiled,
                language: item.language ?? null,
                assignee: item.assignee ?? null,
                monthfield: item.monthfield ?? null,
                is_conceded: item.is_conceded ?? false,
              } as Patent; 
              break;
            case 'software':
              record = {
                ...baseRecord,
                number: item.number,
                yearfiled: item.yearfiled,
                language: item.language ?? null,
                assignee: item.assignee ?? null,
                monthfield: item.monthfield ?? null,
                is_conceded: item.is_conceded ?? false,
                is_multimedia: item.is_multimedia ?? false,
              }as Software;
              break;
            case 'tesis':
              record = {
                ...baseRecord,
                institution: item.institution,
                thesis_type: item.thesis_type,
                tutors: item.tutors || [],
              }as Thesis;
              break;
            case 'evento':
              record = {
                ...baseRecord,
                encounter_name: item.encounter_name,
                isbn: item.isbn ?? null,
                city: item.city ?? null,
                issn: item.issn ?? null,
                organizer: item.organizer ?? null,
                encounter_type: item.encounter_type,
              }as Encounter;
              break;
            case 'premio':
              record = {
                ...baseRecord,
                grant_institution: item.grant_institution,
                prize_type: item.prize_type,
              }as Prize;
              break;
            default:
              continue; // o throw, pero no debería pasar
          }

          allRecords.push(record);
        }
      } catch (error) {
        console.warn(`Error fetching ${key}s for author ${authorId}:`, error);
      }
    }

    return allRecords;
  },
};