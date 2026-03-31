export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  artwork: string;
  duration: number; // in seconds for local, milliseconds for online
  uri?: string; // local or remote file URI
  creationTime?: number; // timestamp for sorting
}

export const songs: Song[] = [];
