import {_runners, AppTasks} from "./gulpApps";
import {IApp, ITask, TaskNameConverter} from "./interfaces";

const runSeqGen = <any>require('run-sequence');

export const gulpApps = {
    clear: () => AppTasks.clear(),
    use: (gulp) => {
        const runSequence : Function = runSeqGen.use(gulp);

        return {
            initTasks: <T extends IApp>(tasks : ITask<T>[], taskNameConverter? : TaskNameConverter) => new AppTasks<T>(gulp, runSequence, tasks, taskNameConverter)
        };
    }
};