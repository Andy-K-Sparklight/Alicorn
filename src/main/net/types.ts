/**
 * A network-level download request for fetching the given resources and save them to the given path.
 */
export interface DownloadRequest {
    urls: string[];
    path: string;
    sha1?: string;
    size?: number;
}