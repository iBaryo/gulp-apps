import {createDecorator} from "../src/decorator";
import {AppTasksDecorator} from "../src/decorator";
import {IApp, ITask, ITaskOf, IAppContextClass, IAppContext} from "../src/interfaces";
import {AppTasks} from "../src/gulpApps";

describe('decorator', ()=> {
    let mockGulp;
    let mockRunSeq: Function;
    let definedTasks : {[taskName : string] : { deps: string[], fn : Function}};
    let mockApp : IApp;
    let GulpApps : AppTasksDecorator<IApp>;
    let mockConverter: (app, task) => string;

    beforeEach(()=> {
        AppTasks.clear();
        mockApp = {name:'app'};
        definedTasks = {};
        mockGulp = {
            task: (name, deps, fn) => {
                definedTasks[name] = {deps, fn};
            }
        };
        mockRunSeq = (...args) => definedTasks[args[0]].fn.call(null, args[args.length-1]);
        mockConverter = jasmine.createSpy('converter').and.callFake((app, task) => task);

        GulpApps = createDecorator<IApp>(mockGulp, mockRunSeq, mockConverter);
    });

    it('should add task according to method taskName', ()=> {
        @GulpApps()
        class Tasks {
            @GulpApps.task()
            public task() {
            }
        }

        GulpApps.getTasks().for(mockApp);
        const task = definedTasks['task'];
        expect(task).toBeTruthy();
    });

    it('should add task with dependencies', ()=> {
        const deps = ['task'];

        @GulpApps()
        class Tasks {
            @GulpApps.task(deps)
            public taskWithDependencies() {}
        }
        GulpApps.getTasks().for(mockApp);

        expect(definedTasks['taskWithDependencies'].deps).toEqual(deps);
    });

    it('should add task with different taskName', ()=> {
        @GulpApps()
        class Tasks {
            @GulpApps.task(['task'], 'different-taskName')
            public taskWithDependencies() {}
        }

        GulpApps.getTasks().for(mockApp);
        expect(definedTasks['different-taskName']).toBeTruthy();
    });

    it('should allow access to all methods in class', (done)=> {
        @GulpApps()
        class Tasks {
            @GulpApps.task()
            public task() {
                this.privateMethod();
            }

            private privateMethod() {
                done();
            }
        }

        GulpApps.getTasks().for(mockApp).run('task');
    });

    it('should expose app context', (done)=> {
        @GulpApps()
        class Tasks implements IAppContext<IApp>{
            constructor(public app : IApp) {}

            @GulpApps.task()
            public task() {
                this.privateMethod();
            }

            private privateMethod() {
                expect(this.app).toBe(mockApp);
                done();
            }
        }

        GulpApps.getTasks().for(mockApp).run('task');
    });
});