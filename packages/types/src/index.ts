// Branded string types
export type TenantId = string & { readonly __brand: 'TenantId' };
export type UserId = string & { readonly __brand: 'UserId' };
export type CourseId = string & { readonly __brand: 'CourseId' };
export type ModuleId = string & { readonly __brand: 'ModuleId' };
export type PageId = string & { readonly __brand: 'PageId' };

// Domain interfaces
export interface User {
  id: UserId;
  tenantId: TenantId;
  email: string;
  name: string;
  role: string;
}

export interface Course {
  id: CourseId;
  tenantId: TenantId;
  title: string;
  description: string;
  termId: string;
}

export interface Module {
  id: ModuleId;
  courseId: CourseId;
  position: number;
  name: string;
}

export interface Page {
  id: PageId;
  moduleId?: ModuleId;
  courseId?: CourseId;
  title: string;
  bodyMarkdown: string;
}


