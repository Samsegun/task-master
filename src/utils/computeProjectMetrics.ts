export const projectTasksLength = (tasks: any[]) => tasks.length;

export const numOfcompletedTasks = (tasks: any[]) =>
    tasks.filter(t => t.status === "DONE").length;

export const progressNumber = (totalTasks: number, completedTasks: number) =>
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
