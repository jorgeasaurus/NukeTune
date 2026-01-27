export type DangerLevel = "low" | "medium" | "high" | "critical";

export interface IntuneObject {
  id: string;
  displayName?: string;
  name?: string;
  "@odata.type"?: string;
  createdDateTime?: string;
  lastModifiedDateTime?: string;
  description?: string;
  selected?: boolean;
  [key: string]: unknown;
}

export interface GraphListResponse<T> {
  "@odata.context"?: string;
  "@odata.nextLink"?: string;
  "@odata.count"?: number;
  value: T[];
}

export interface IntuneCategory {
  id: string;
  name: string;
  description: string;
  dangerLevel: DangerLevel;
  listEndpoint: string;
  deleteEndpoint: string;
  useBeta: boolean;
  icon: string;
  filter?: string;
  cannotDelete?: string[];
  requiresAppPermissions?: boolean;
}

export interface CategoryState {
  category: IntuneCategory;
  selected: boolean;
  objects: IntuneObject[];
  loading: boolean;
  error: string | null;
  deletionProgress: number;
  deletedCount: number;
  failedCount: number;
}

export interface DeletionLogEntry {
  timestamp: Date;
  categoryId: string;
  categoryName: string;
  objectId: string;
  objectName: string;
  status: "success" | "error" | "skipped";
  message?: string;
}

export interface GraphError {
  statusCode: number;
  code: string;
  message: string;
  requestId?: string;
}
