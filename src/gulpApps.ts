import {ITaskRunner, TaskNameConverter, ITask, IApp} from "./interfaces";

const runSeqGen = require('run-sequence');

const defaultConverter: TaskNameConverter = (appName, taskName) => `${appName}-${taskName}`;

const _runners: {[name: string]: ITaskRunner} = {};

module.exports = {
    use: (gulp) => {
        const runSequence: Function = runSeqGen.use(gulp);

        return {
            initTasks: <T extends IApp>(tasks: ITask<T>[]) => ({
                get: (appName: string) => _runners[appName],
                for: (app: T, taskNameConverter = defaultConverter): ITaskRunner => {

                    if (!_runners[app.name]) {
                        const nameConverter = (taskName: string) => taskNameConverter(app.name, taskName);

                        tasks.forEach(task =>
                            gulp.task(
                                nameConverter(task.name),
                                !task.dependencies ? [] : task.dependencies.map(nameConverter),
                                task.fn.length > 1 ? (done) => task.fn(app, done) : () => task.fn(app) // can this be better?
                            )
                        );

                        _runners[app.name] = {
                            run: (task: string) =>
                                new Promise<void>((resolve, reject) => runSequence(nameConverter(task), e => e ? reject(e) : resolve()))
                        };
                    }
                    return _runners[app.name];
                }
            })
        }
    }
};