# gulp-apps
Do you have several apps or components but you want to expose the same build process?
Then this is the package for you.

##To install:
``npm i gulp-apps --save-dev``

##Usage

gulpfile.ts :


### Defining tasks template
```
import {IApp, gulpApps, IAppContext} from "gulp-apps";
const gulp = require('gulp');
const apps = require('gulp-apps').gulpApps;

// The structure of my apps
interface IMyApp extends IApp {
    dir: string;
    enabled: boolean;
}

// Initializing tasks template
const tasks =
    apps.use(gulp).initTasks<IMyApp>([
        {
            name: 'task-1',
            fn: () => {
                console.log('hello from task-1');
            }
        },
        {
            name: 'task-2',
            dependencies: ['task-1'],
            fn: (done) => {
                console.log('task-2 has dependencies');
                Promise.resolve().then(done);
            }
        },
        {
            name: 'task-3',
            dependencies: ['task-1', 'task-2'],
            fn: function(this : IAppContext<IMyApp>) => {
                console.log('accessing relevant app on task run-time');
                console.log(this.app.name);
            }
        }
    ]);
```

### Creating tasks for apps

```
// Initializing tasks for a given app to get a runner.
const runner = tasks.for({
    name: 'firstApp',
    dir: './app1',
    enabled: true
});

// or initialize for multiple apps to get a group runner 
const groupRunner = tasks.forAll([
    {
        name: 'secondApp',
        enabled: true,
        dir: './app2'
    },
    {
        name: 'thirdApp',
        enabled: false,
        dir: './app3'
    }
]);

```

Result in defined tasks:

```
[22:37:25] Tasks for ~\projects\tmp\gulpfile.js
[22:37:25] ├── firstApp-task-1
[22:37:25] ├─┬ firstApp-task-2
[22:37:25] │ └── firstApp-task-1
[22:37:25] ├─┬ firstApp-task-3
[22:37:25] │ ├── firstApp-task-1
[22:37:25] │ └── firstApp-task-2
[22:37:25] ├── secondApp-task-1
[22:37:25] ├─┬ secondApp-task-2
[22:37:25] │ └── secondApp-task-1
[22:37:25] ├─┬ secondApp-task-3
[22:37:25] │ ├── secondApp-task-1
[22:37:25] │ └── secondApp-task-2
[22:37:25] ├── thirdApp-task-1
[22:37:25] ├─┬ thirdApp-task-2
[22:37:25] │ └── thirdApp-task-1
[22:37:25] └─┬ thirdApp-task-3
[22:37:25]   ├── thirdApp-task-1
[22:37:25]   └── thirdApp-task-2

```

### Running tasks
And now that we have the runners for the apps, we can invoke tasks:

```
// invoking task for our single app runner
runner.run('task-3');

// run for group in parallal.
groupRunner.run('task-3');

// or in sequence
groupRunner.runInSequence('task-3');
```

###Example
It's useful to expose base tasks and set more down the road:

```
gulp.task('build-enabled', (done) => {
    const myApps = require('./myApps.json') as IMyApp[];
    tasks.forAll(myApps.filter(app => app.enabled)).run('my-build-task').then(done);
});
```


##Class Decorator
`gulp-apps` also has decorator support!

```
const GulpApp = gulpApps.use(gulp).getDecorator<IMyApp>();

@GulpApp()
class Tasks implements IAppContext<IMyApp> {
    constructor(public app : IMyApp) {}

    @GulpApp.task()
    public myTask() {}

    @GulpApp.task(['myTask'])
    public secondTask() {}

    @GulpApp.task(['secondTask'], 'diff-name')
    public thirdTask() {}

    @GulpApp.task(['diff-name'])
    public accessApp() {
        console.log(this.app.name);
    }

    @GulpApp.task(['accessApp', 'diff-name'])
    public accessPrivateMethods() {
        this.privateMethod();
    }

    private privateMethod() {
        console.log('this is not a gulp task');
        console.log(this.app.name);
    }

    @GulpApp.task(['accessPrivateMethods'])
    public default() {

    }
}


gulp.task('do-it', ()=> {
    GulpApp.getTasks().for({
        name: 'my-cool-app',
        dir: './',
        enabled: true
    })
        .run('default');
});
```
