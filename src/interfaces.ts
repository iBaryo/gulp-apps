export interface gulpApps {
    use: (gulp) => {
        initTasks: <T extends IApp>(tasks: ITask<T>[]) => {
            get: (appName : string) => ITaskRunner,
            for: (app: T, taskNameConverter? : TaskNameConverter) => ITaskRunner
        }
    }
}

export interface ITaskRunner {
    run: RunTaskFunction;
}

export interface RunTaskFunction {
    (task : string) : Promise<any>;
}

export interface ITask<T extends IApp> {
    name: string;
    dependencies?: string[];
    fn: (app: T, done?: () => void) => void;
}

export interface IApp {
    name: string;
}

export type TaskNameConverter = (appName: string, taskName: string) => string;