// Query-key factories — keep react-query keys consistent and invalidatable.
// Only signedUrl exists today (YAGNI); add feed/metrics keys when those reads adopt react-query.
export const qk = {
  signedUrl: (bucket: string, path: string) => ["signed-url", bucket, path] as const,
};
