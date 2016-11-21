import {AppTasks} from "./gulpApps";
import {IApp, TaskNameConverter} from "./interfaces";

export interface AppTasksDecorator<T extends IApp> {
    (dependencies?: string[], taskName?: string): MethodDecorator;
    getTasks: ()=>AppTasks<T>;
}

export function createDecorator<T extends IApp>(gulp, runSeq, taskNameConverter? : TaskNameConverter) : AppTasksDecorator<T> {
    const appTasks = new AppTasks(gulp, runSeq, [], taskNameConverter);
    const methodDecorator = <AppTasksDecorator<T>>function (dependencies?: string[], taskName?: string) {
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            appTasks.addTask({
                taskName: taskName || propertyKey,
                dependencies: dependencies,
                fn: descriptor.value
            });
        };
    };

    methodDecorator.getTasks = () => appTasks;

    return methodDecorator;
}