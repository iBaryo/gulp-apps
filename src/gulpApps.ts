import {ITaskRunner, TaskNameConverter, ITask, IApp, gulpApps} from "./interfaces";

const runSeqGen = <any>require('run-sequence');
const defaultConverter : TaskNameConverter = (appName, taskName) => `${appName}-${taskName}`;

const _runners : {[name : string] : ITaskRunner} = {};

class AppTasks<T extends IApp> {

    constructor(private _gulp, private _runSeq, private _tasks : ITask<T>[]) {
    }

    public addTask = (task : ITask<T>) => this._tasks.push(task);
    public get = (appName : string) => _runners[appName];

    public forAll(apps : T[], taskNameConverter? : TaskNameConverter) : ITaskRunner {
        const runners = apps.map(app => this.for(app, taskNameConverter));
        return {
            run: (task : string) => Promise.all(runners.map(runner => runner.run(task)))
        };
    }

    public for(app : T, taskNameConverter = defaultConverter) : ITaskRunner {

        if (!_runners[app.name]) {
            const nameConverter = (taskName : string) => taskNameConverter(app.name, taskName);

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

module.exports = {
    use: (gulp) => {
        const runSequence : Function = runSeqGen.use(gulp);

        return {
          initTasks: <T extends IApp>(tasks : ITask<T>[]) => new AppTasks<T>(gulp, runSequence, tasks)
        };
    }
};