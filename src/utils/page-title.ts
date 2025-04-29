export function createPageTitle(title: string) {
  return {
    head: () => ({
      title: `${title} | GradGo`,
    }),
  }
} 