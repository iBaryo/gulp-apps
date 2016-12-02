import {
    ITaskRunner, TaskNameConverter, ITask, IApp, ITaskGroupRunner, IAppContextClass, RunTaskFunction, IAppContext
} from "./interfaces";
import {ITaskOf} from "./interfaces";

const defaultConverter : TaskNameConverter = (appName, taskName) => `${appName}-${taskName}`;

export const _appRunners : {[name : string] : ITaskRunner} = {};

export class AppTasks<T extends IApp> {

    static clear = () => Object.keys(_appRunners).forEach(key => delete _appRunners[key]);

    private _tasksClass : IAppContextClass<T>;

    constructor(gulp, runSequence, tasksClass : IAppContextClass<T>, taskNameConverter? : TaskNameConverter);
    constructor(gulp, runSequence, tasks : ITask<T>[], taskNameConverter? : TaskNameConverter);
    constructor(private _gulp, private _runSeq, tasks : ITask<T>[]|IAppContextClass<T>, private _taskNameConverter = defaultConverter) {
        if (typeof tasks == 'function') {
            this._tasksClass = tasks;
        }
        else {
            this._tasksClass = class AppContext {
                public run : RunTaskFunction;
                public app : T;
            };

            tasks.forEach(task => this.addTask(task));
        }
    }

    private getGulpTasks() : ITaskOf<T>[] {
        return Object.getOwnPropertyNames(this._tasksClass.prototype)
            .reduce((tasks, prop) => {
                const candidate = this._tasksClass.prototype[prop] as ITaskOf<T>;
                if (typeof candidate == 'function' && candidate.isPublicTask)
                    tasks.push(candidate);

                return tasks;
            }, [] as ITaskOf<T>[])
    }

    private convertTaskObjectToFunc(task : ITask<T>) : ITaskOf<T> {
        const fn = task.fn as ITaskOf<T>;
        fn.isPublicTask = true;
        fn.taskName = task.taskName;
        fn.dependencies = task.dependencies;
        return fn;
    }

    public addTask = (task : ITask<T>) => this._tasksClass.prototype[task.taskName] = this.convertTaskObjectToFunc(task); // will effect only newly added apps
    public get = (appName : string) => _appRunners[appName];

    public forAll(apps : T[]) : ITaskGroupRunner {
        apps.forEach(app => this.for(app));
        const nameConverter = (task) => apps.map(app => this._taskNameConverter(app.name, task));

        return {
            run: (task : string) => new Promise(resolve => this._runSeq(nameConverter(task), resolve)),
            runInSequence: (task : string) => new Promise(resolve => this._runSeq(...nameConverter(task), resolve))
        };

        // return {
        //     run: (task : string) => Promise.all(runners.map(runner => runner.run(task))),
        //     runSync: async (task : string) => {
        //         for (const runner of runners)
        //             await runner.run(task);
        //     }
        // };
    }

    public for(app : T) : ITaskRunner {

        if (!_appRunners[app.name]) {

            const appContext = this.createAppContext(app, (task : string) =>
                new Promise<void>((resolve, reject) =>
                    this._runSeq(nameConverter(task), e => e ? reject(e) : resolve())
                )
            );

            _appRunners[app.name] = appContext;

            const nameConverter = (taskName : string) => this._taskNameConverter(app.name, taskName);

            this.getGulpTasks().forEach(task =>     // maybe cache gulpTasks?
                this._gulp.task(
                    nameConverter(task.taskName),
                    !task.dependencies ? [] : task.dependencies.map(nameConverter),
                    task.bind(appContext)
                )
            );
        }
        return _appRunners[app.name];
    }

    private createAppContext(app : T, runFn : RunTaskFunction) {
        let appContext : IAppContext<T>;
        switch (this._tasksClass.length) {
            case 1:
                appContext = new this._tasksClass(app);
                appContext.run = runFn;
                break;
            case 2:
                appContext = new this._tasksClass(app, runFn);
                break;
            case 0:
            default:
                appContext = new this._tasksClass();
                appContext.app = app;
                appContext.run = runFn;
                break;
        }

        return appContext;
    }
}