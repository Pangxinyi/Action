export const getEventColor = (evt: any, projects: any[], categories: Record<string, string>) => {
  if (!evt) return '#9CA3AF';
  if (evt.projectId) {
    const project = projects?.find((p: any) => p.id === evt.projectId);
    if (project) return project.hexColor;
  }
  if (evt.category && categories && categories[evt.category]) {
    return categories[evt.category];
  }
  return evt.hexColor || '#9CA3AF';
};
