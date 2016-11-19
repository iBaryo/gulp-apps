import {gulpApps, AppTasks} from "../src/gulpApps";
import {IApp, ITask, ITaskRunner} from "../src/interfaces";
import Spy = jasmine.Spy;

describe('gulp-apps', () => {

    let mockGulp;
    let mockApps: IApp[];
    let mockApp: IApp;
    let mockTasks: ITask<IApp>[];

    beforeEach(() => {
        mockGulp = {
            task: jasmine.createSpy('gulp task spy')
        };

        let mockNames = ['1', '2', '3'];

        mockApps = mockNames.map(name => ({name: `mock_app_${name}`}  as IApp));
        mockApp = mockApps[0];

        let mockTaskNames = mockNames.map(name => `mock_task_${name}`);
        mockTasks = mockTaskNames.map((task, index) => ({
                name: task,
                dependencies: mockTaskNames.reduce((deps, depTask, depIndex) => {
                    if (depIndex < index) // each mock task depends on the ones before it
                        deps.push(depTask);
                    return deps;
                }, []),
                fn: jasmine.createSpy(`${task} fn`).and.returnValue(undefined)
            }) as ITask<IApp>
        );
    });

    describe('accessor', () => {
        it('dummy', () => {
            expect(gulpApps).toBeTruthy();
        });

        it('should init with gulp and prepare for init tasks', () => {
            expect(gulpApps.use(mockGulp)).toBeTruthy();
            expect(gulpApps.use(mockGulp).initTasks).toBeTruthy();
        });

        it('should init tasks', () => {
            const appTasks = gulpApps.use(mockGulp).initTasks<IApp>(mockTasks);

            expect(appTasks).toEqual(jasmine.any(AppTasks));
        });
    });

    describe('AppTasks', () => {
        let appTasks: AppTasks<IApp>;
        let mockRunSeq: Function;
        let mockConverter;

        beforeEach(() => {
            gulpApps.clear();
            mockRunSeq = jasmine.createSpy('run sequence').and.callFake((...args) => {
                args[args.length - 1]();
            });
            mockConverter = jasmine.createSpy('converter').and.callFake((app, task) => `${app}-${task}`);
            appTasks = new AppTasks<IApp>(mockGulp, mockRunSeq, mockTasks, mockConverter);
        });

        describe('"for" method', () => {
            let taskRunner: ITaskRunner;
            beforeEach(() => taskRunner = appTasks.for(mockApp));

            it('should define tasks specific for the app', () => {
                expect(mockGulp.task).toHaveBeenCalledTimes(mockTasks.length);

                (mockGulp.task as Spy).calls.all().forEach((call, index) => {
                    expect(call.args[0]).toBe(mockConverter(mockApp.name, mockTasks[index].name));
                });
            });
            it('should define task dependencies for tasks of the same app', () => {
                (mockGulp.task as Spy).calls.all().forEach((call, index) => {
                    const dependencies = call.args[1] as string[];
                    expect(dependencies).toEqual(jasmine.any(Array));
                    dependencies.forEach((dep, depIndex) => {
                        expect(dep).toBe(mockConverter(mockApp.name, mockTasks[index].dependencies[depIndex]));
                    });
                });
            });
            it('should return a task runner', () => {
                expect(taskRunner).toBeTruthy();
                expect(taskRunner.run).toBeTruthy();
            });
            it('should return the same task runner when calling for it another time', () => {
                [1, 2, 3, 4].forEach(() => {
                    expect(appTasks.for(mockApp)).toBe(taskRunner);
                });
            });

            describe('task runner', () => {
                let taskName: string;
                beforeEach(() => {
                    taskName = mockTasks[0].name;
                });

                it('should return a promise', () => {
                    expect(taskRunner.run(mockTasks[0].name)).toEqual(jasmine.any(Promise));
                });
                it('should run task for original app', (done) => {
                    taskRunner.run(taskName).then(() => {
                        expect(mockRunSeq).toHaveBeenCalledTimes(1);
                        const runSeqCall = (mockRunSeq as Spy).calls.mostRecent();
                        expect(runSeqCall.args[0]).toBe(mockConverter(mockApp.name, taskName));
                        expect(runSeqCall.args[1]).toEqual(jasmine.any(Function));
                        done();
                    });
                });
                it('should reject promise if fails', (done) => {
                    (mockRunSeq as Spy).and.callFake((...args) => args[args.length - 1]('error'));

                    taskRunner.run(taskName)
                        .then(fail)
                        .catch(e => {
                            expect(e).toBe('error');
                            done();
                        });
                });
            });
        });

        describe('"get" method', () => {
            it('should return undefined if runner was not created', () => {
                expect(appTasks.get(mockApp.name)).toBeUndefined();
            });
            it('should return the runner if it was defined', () => {
                const runner = appTasks.for(mockApp);
                expect(appTasks.get(mockApp.name)).toBe(runner);
            });
        });

        describe('"forAll" method', () => {
            it('should create group runners for all given apps', () => {
                const runner = appTasks.forAll(mockApps);

                expect(runner).toBeTruthy();
                expect(runner.run).toBeTruthy();
                expect(runner.runInSequence).toBeTruthy();
            });
            it('should able to run task async', (done) => {
                const taskName = mockTasks[0].name;
                appTasks.forAll(mockApps).run(taskName).then(()=> {
                    expect(mockRunSeq).toHaveBeenCalledTimes(1);
                    expect((mockRunSeq as Spy).calls.mostRecent().args[0]).toEqual(mockApps.map(app => mockConverter(app.name,taskName)));
                    done();
                });
            });
            it('should able to run task sync', (done) => {
                const taskName = mockTasks[0].name;
                appTasks.forAll(mockApps).runInSequence(taskName).then(()=> {
                    expect(mockRunSeq).toHaveBeenCalledTimes(1);
                    const args =(mockRunSeq as Spy).calls.mostRecent().args;
                    args.length--; // remove last argument (done callback)
                    expect(args.length).toBe(mockApps.length);
                    mockApps.forEach((app,i)=> expect(args[i]).toBe(mockConverter(app.name,taskName)));
                    done();
                });
            });
        });

        describe('"addTask" method', () => {
            it('should create added task for newly added apps', () => {
                // Arrange
                const newTask: ITask<IApp> = {
                    name: 'new task',
                    fn: jasmine.createSpy('new task')
                };
                const newApp: IApp = {name: 'new_app'};

                // Act
                appTasks.addTask(newTask);

                // Assert
                const runner = appTasks.for(newApp);

                expect(mockGulp.task).toHaveBeenCalledTimes(mockTasks.length);
                expect(
                    mockGulp.task.calls.all().filter(call => call.args[0] == mockConverter(newApp.name, newTask.name)).length
                ).toBe(1);
            });
        });
    });
});