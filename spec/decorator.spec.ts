import {createDecorator} from "../src/decorator";
import {IAppTasksDecorator} from "../src/decorator";
import {IApp, IAppContext, RunTaskFunction} from "../src/interfaces";
import {AppTasks} from "../src/gulpApps";

describe('decorator', ()=> {
    let mockGulp;
    let mockRunSeq : Function;
    let definedTasks : {[taskName : string] : { deps : string[], fn : Function}};
    let mockApp : IApp;
    let GulpApps : IAppTasksDecorator<IApp>;
    let mockConverter : (app, task) => string;

    beforeEach(()=> {
        AppTasks.clear();
        mockApp = {name: 'app'};
        definedTasks = {};
        mockGulp = {
            task: (name, deps, fn) => {
                definedTasks[name] = {deps, fn};
            }
        };
        mockRunSeq = (...args) => {
            if (definedTasks[args[0]].fn.length > 0)
                definedTasks[args[0]].fn.call(null, args[args.length - 1]);
            else {
                definedTasks[args[0]].fn.call(null);
                args[args.length - 1]();
            }
        };
        mockConverter = jasmine.createSpy('converter').and.callFake((app, task) => task);

        GulpApps = createDecorator<IApp>(mockGulp, mockRunSeq, mockConverter);
    });

    it('should add task according to method taskName', ()=> {
        @GulpApps()
        class Tasks implements IAppContext<IApp> {
            public app : IApp;
            public run : RunTaskFunction;

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
        class Tasks implements IAppContext<IApp> {
            public app : IApp;
            public run : RunTaskFunction;

            @GulpApps.task(deps)
            public taskWithDependencies() {
            }
        }
        GulpApps.getTasks().for(mockApp);

        expect(definedTasks['taskWithDependencies'].deps).toEqual(deps);
    });

    it('should add task with different taskName', ()=> {
        @GulpApps()
        class Tasks implements IAppContext<IApp> {
            public app : IApp;
            public run : RunTaskFunction;

            @GulpApps.task(['task'], 'different-taskName')
            public taskWithDependencies() {
            }
        }

        GulpApps.getTasks().for(mockApp);
        expect(definedTasks['different-taskName']).toBeTruthy();
    });

    it('should allow access to all methods in class', (done)=> {
        @GulpApps()
        class Tasks implements IAppContext<IApp> {
            public app : IApp;
            public run : RunTaskFunction;

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
        class Tasks implements IAppContext<IApp> {
            public app : IApp;
            public run : RunTaskFunction;

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

    it('should expose task runner', (done)=> {
        @GulpApps()
        class Tasks implements IAppContext<IApp> {
            public app : IApp;
            public run : RunTaskFunction;
            public spy = jasmine.createSpy('other task');

            @GulpApps.task()
            public task() {
                this.run('otherTask').then(()=> {
                    expect(this.spy).toHaveBeenCalled();
                    done();
                });
            }

            @GulpApps.task()
            public otherTask() {
                this.spy();
            }
        }

        GulpApps.getTasks().for(mockApp).run('task');
    });

    describe('constructor overloading', ()=> {
        it('should inject app and runner directly to instance when ctor does not have parameters', (done)=> {
            @GulpApps()
            class Tasks implements IAppContext<IApp> {
                public app : IApp;
                public run : RunTaskFunction;

                @GulpApps.task()
                public task() {
                    expect(this.app).toBe(mockApp);
                    expect(this.run).toEqual(jasmine.any(Function));
                    done();
                }
            }

            GulpApps.getTasks().for(mockApp).run('task');
        });
        it('should pass app to constructor and inject runner directly to instance', (done)=> {
            @GulpApps()
            class Tasks implements IAppContext<IApp> {
                public run : RunTaskFunction;

                constructor(public app : IApp) {
                    expect(this.app).toBe(mockApp);
                    expect(this.run).toBeUndefined();
                }

                @GulpApps.task()
                public task() {
                    expect(this.run).toEqual(jasmine.any(Function));
                    done();
                }
            }

            GulpApps.getTasks().for(mockApp).run('task');
        });
        it('should pass app and runner to constructor', (done)=> {
            @GulpApps()
            class Tasks implements IAppContext<IApp> {
                constructor(public app : IApp, public run : RunTaskFunction) {
                    expect(this.app).toBe(mockApp);
                    expect(this.run).toEqual(jasmine.any(Function));
                }

                @GulpApps.task()
                public task() {
                    done();
                }
            }

            GulpApps.getTasks().for(mockApp).run('task');
        });
    });
});