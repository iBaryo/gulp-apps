import {createDecorator} from "../src/decorator";
import {AppTasksDecorator} from "../src/decorator";
import {IApp} from "../src/interfaces";
import {AppTasks} from "../src/gulpApps";

xdescribe('decorator', ()=> {
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
            name: 'task',
            dependencies: undefined,
            fn: Tasks.prototype.task
        });
    });

    it('should add task with dependencies', ()=> {
        class Tasks {
            @GulpAppsTask(['task'])
            public taskWithDependencies() {}
        }

        expect(appTasks.addTask).toHaveBeenCalledWith({
            name: 'taskWithDependencies',
            dependencies: ['task'],
            fn: Tasks.prototype.taskWithDependencies
        });
    });

    it('should add task with different taskName', ()=> {
        class Tasks {
            @GulpAppsTask(['task'], 'different-taskName')
            public taskWithDependencies() {}
        }

        expect(appTasks.addTask).toHaveBeenCalledWith({
            name: 'different-taskName',
            dependencies: ['task'],
            fn: Tasks.prototype.taskWithDependencies
        });
    });
});