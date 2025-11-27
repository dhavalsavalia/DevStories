export type EpicStatus = string;

export interface Epic {
  id: string;
  title: string;
  status: EpicStatus;
  sprint?: string;
  created: Date;
  updated?: Date;
  content: string;
  filePath?: string;
}
