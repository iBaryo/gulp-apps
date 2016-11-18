export interface ITaskRunner {
    run: RunTaskFunction;
}

export interface RunTaskFunction {
    (task : string) : Promise<void>;
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