import {AppTasks} from "./gulpApps";
import {IApp, TaskNameConverter, ITaskOf} from "./interfaces";

export interface IAppTasksDecorator<T extends IApp> {
    (): ClassDecorator;
    task(dependencies?: string[], taskName?: string): MethodDecorator;
    getTasks: ()=>AppTasks<T>;
}

export function createDecorator<T extends IApp>(gulp, runSeq, taskNameConverter?: TaskNameConverter): IAppTasksDecorator<T> {
    let appTasks: AppTasks<T>;
    const decorator = <IAppTasksDecorator<T>>function () {
        return function (target) {
            appTasks = new AppTasks<T>(gulp, runSeq, target, taskNameConverter);
        }
    };

    decorator.task = function (dependencies?: string[], taskName?: string) {
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            const task = descriptor.value as ITaskOf<T>;
            task.isPublicTask = true;
            task.taskName = taskName || propertyKey;
            task.dependencies = dependencies;
        };
    };

    decorator.getTasks = () => appTasks;

    return decorator;
}