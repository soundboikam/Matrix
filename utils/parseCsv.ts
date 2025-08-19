import Papa from "papaparse";

export type ParsedRow = {
  artist: string;
  totalPlays: number;
  [key: string]: any;
};

export function parseCsvFile(file: File): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        const cleaned = results.data.map((row: any) => ({
          artist: row["Artist"] || "",
          totalPlays: Number(row["Total Plays"] || 0),
          ...row,
        }));
        resolve(cleaned);
      },
      error: (error) => reject(error),
    });
  });
}


