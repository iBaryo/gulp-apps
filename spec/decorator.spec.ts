import {createDecorator} from "../src/decorator";
import {AppTasksDecorator} from "../src/decorator";
import {IApp, ITask} from "../src/interfaces";
import {AppTasks} from "../src/gulpApps";

describe('decorator', ()=> {
    let mockGulp;
    let mockRunSeq: Function;
    let GulpAppsTask : AppTasksDecorator<IApp>;
    let appTasks : AppTasks<IApp>;


    beforeEach(()=> {
        mockGulp = {
            task: jasmine.createSpy('gulp task spy')
        };
        mockRunSeq = jasmine.createSpy('run sequence');

        GulpAppsTask = createDecorator<IApp>(mockGulp, mockRunSeq);
        appTasks = GulpAppsTask.getTasks();
        spyOn(appTasks, 'addTask');
    });

    it('should add task according to method taskName', ()=> {
        class Tasks {
            @GulpAppsTask()
            public task() {
            }
        }

        expect(appTasks.addTask).toHaveBeenCalledWith({
            taskName: 'task',
            dependencies: undefined,
            fn: Tasks.prototype.task
        } as ITask<IApp>);
    });

    it('should add task with dependencies', ()=> {
        class Tasks {
            @GulpAppsTask(['task'])
            public taskWithDependencies() {}
        }

        expect(appTasks.addTask).toHaveBeenCalledWith({
            taskName: 'taskWithDependencies',
            dependencies: ['task'],
            fn: Tasks.prototype.taskWithDependencies
        } as ITask<IApp>);
    });

    it('should add task with different taskName', ()=> {
        class Tasks {
            @GulpAppsTask(['task'], 'different-taskName')
            public taskWithDependencies() {}
        }

        expect(appTasks.addTask).toHaveBeenCalledWith({
            taskName: 'different-taskName',
            dependencies: ['task'],
            fn: Tasks.prototype.taskWithDependencies
        } as ITask<IApp>);
    });
});