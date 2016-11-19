import {ITaskRunner, TaskNameConverter, ITask, IApp, ITaskGroupRunner} from "./interfaces";

const defaultConverter : TaskNameConverter = (appName, taskName) => `${appName}-${taskName}`;

export const _runners : {[name : string] : ITaskRunner} = {};

export class AppTasks<T extends IApp> {

    static clear = () => Object.keys(_runners).forEach(key => delete _runners[key]);

    constructor(private _gulp, private _runSeq, private _tasks : ITask<T>[], private _taskNameConverter = defaultConverter) {
    }

    public addTask = (task : ITask<T>) => this._tasks.push(task);
    public get = (appName : string) => _runners[appName];

    public forAll(apps : T[]) : ITaskGroupRunner {
        apps.forEach(app => this.for(app));
        const nameConverter = (task) => apps.map(app => this._taskNameConverter(app.name,task));

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

        if (!_runners[app.name]) {
            const nameConverter = (taskName : string) => this._taskNameConverter(app.name, taskName);

            this._tasks.forEach(task =>
                this._gulp.task(
                    nameConverter(task.name),
                    !task.dependencies ? [] : task.dependencies.map(nameConverter),
                    task.fn.length > 1 ? (done) => task.fn(app, done) : () => task.fn(app) // can this be better?
                )
            );

            _runners[app.name] = {
                run: (task : string) =>
                    new Promise<void>((resolve, reject) =>
                        this._runSeq(nameConverter(task), e => e ? reject(e) : resolve()))
            };
        }
        return _runners[app.name];
    }
}