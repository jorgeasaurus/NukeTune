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
  /** Set at fetch time when the object must never be deleted. */
  _protectedReason?: string;
  _categoryId?: string;
  _categoryName?: string;
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
  /** Raw OData $filter applied to the list call. */
  filter?: string;
  /** Delete `{object}/assignments/*` before deleting the object itself. */
  deleteAssignmentsFirst?: boolean;
  requiresAppPermissions?: boolean;
}

export interface CategoryState {
  category: IntuneCategory;
  selected: boolean;
  objects: IntuneObject[];
  loading: boolean;
  /** True once a fetch has completed, even if it returned 0 objects. */
  loaded: boolean;
  error: string | null;
  /** Objects queued in the current/last deletion run. */
  runTotal: number;
  deletedCount: number;
  failedCount: number;
  skippedCount: number;
  /** Objects that failed in the last run (for "Retry failed"). */
  failedObjectIds: string[];
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
