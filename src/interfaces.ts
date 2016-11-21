export interface IApp {
    name: string;
}

export interface IAppContext<T extends IApp> {
    app : T;
}

export type TaskNameConverter = (appName: string, taskName: string) => string;

export interface ITaskRunner {
    run: RunTaskFunction;
}

export interface  ITaskGroupRunner extends ITaskRunner {
    runInSequence: RunTaskFunction;
}

export interface RunTaskFunction {
    (task : string) : Promise<any>;
}

export interface IGulpTask {
    taskName: string;
    dependencies?: string[];
}

export interface IAppTaskMethod<T extends IApp> {
    (this: IAppContext<T>, done?: () => void) : void;
}

export interface ITask<T extends IApp> extends IGulpTask {
    fn: IAppTaskMethod<T>;
}

export interface ITaskOf<T extends IApp> extends IGulpTask, IAppTaskMethod<T>  {
    isTask: boolean;
}