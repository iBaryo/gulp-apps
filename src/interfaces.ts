export interface ITaskRunner {
    run: RunTaskFunction;
}

export interface  ITaskGroupRunner extends ITaskRunner {
    runInSequence: RunTaskFunction;
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