import {ITaskRunner, TaskNameConverter, ITask, IApp, ITaskGroupRunner} from "./interfaces";
import {ITaskOf} from "./interfaces";
import {IAppContext} from "./interfaces";

const defaultConverter: TaskNameConverter = (appName, taskName) => `${appName}-${taskName}`;

export const _runners: {[name: string]: ITaskRunner} = {};

export class AppTasks<T extends IApp> {

    static clear = () => Object.keys(_runners).forEach(key => delete _runners[key]);

    private _tasks : ITaskOf<T>[] = [];

    constructor(gulp, runSequence, tasksClass :Function, taskNameConverter? : TaskNameConverter);
    constructor(gulp, runSequence, tasks :ITask<T>[], taskNameConverter? : TaskNameConverter);
    constructor(private _gulp, private _runSeq, tasks: ITask<T>[]|Function, private _taskNameConverter = defaultConverter) {
        if (typeof tasks == 'function')
            this._tasks = this.convertClassToTasks(tasks);
        else
            this._tasks = tasks.map(this.convertTaskObjectToFunc);
    }

    private convertClassToTasks(appTasksClass: Function) : ITaskOf<T>[] {
        return Object.getOwnPropertyNames(appTasksClass.prototype)
            .reduce((tasks, prop) => {
                const candidate = appTasksClass.prototype[prop] as Function&ITaskOf<T>;
                if (typeof candidate == 'function' && candidate.isTask)
                    tasks.push(candidate);

                return tasks;
            }, [] as ITaskOf<T>[])
    }

    private convertTaskObjectToFunc(task : ITask<T>) : ITaskOf<T> {
        const fn = task.fn as ITaskOf<T>;
        fn.dependencies = task.dependencies;
        fn.taskName = task.taskName;
        fn.isTask = true;
        return fn;
    }

    public addTask = (task: ITask<T>) => this._tasks.push(this.convertTaskObjectToFunc(task));
    public get = (appName: string) => _runners[appName];

    public forAll(apps: T[]): ITaskGroupRunner {
        apps.forEach(app => this.for(app));
        const nameConverter = (task) => apps.map(app => this._taskNameConverter(app.name, task));

        return {
            run: (task: string) => new Promise(resolve => this._runSeq(nameConverter(task), resolve)),
            runInSequence: (task: string) => new Promise(resolve => this._runSeq(...nameConverter(task), resolve))
        };

        // return {
        //     run: (task : string) => Promise.all(runners.map(runner => runner.run(task))),
        //     runSync: async (task : string) => {
        //         for (const runner of runners)
        //             await runner.run(task);
        //     }
        // };
    }

    public for(app: T): ITaskRunner {

        if (!_runners[app.name]) {
            const nameConverter = (taskName: string) => this._taskNameConverter(app.name, taskName);

            this._tasks.forEach(task =>
                this._gulp.task(
                    nameConverter(task.taskName),
                    !task.dependencies ? [] : task.dependencies.map(nameConverter),
                    task.bind({app} as IAppContext<T>)
                )
            );

            _runners[app.name] = {
                run: (task: string) =>
                    new Promise<void>((resolve, reject) =>
                        this._runSeq(nameConverter(task), e => e ? reject(e) : resolve()))
            };
        }
        return _runners[app.name];
    }
}