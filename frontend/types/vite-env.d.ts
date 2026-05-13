interface ImportMeta {
  readonly glob: <T = unknown>(
    pattern: string,
    options?: { eager?: boolean }
  ) => Record<string, () => Promise<T>>
}

