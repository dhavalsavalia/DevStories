export type EpicStatus = string;

export interface Epic {
  id: string;
  title: string;
  status: EpicStatus;
  created: Date;
  updated?: Date;
  content: string;
  filePath?: string;
}
