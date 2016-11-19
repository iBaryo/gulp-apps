# gulp-apps
running same gulp tasks for multiple apps

gulpfile.ts :
```
import {IApp} from "gulp-apps";
const gulp = require('gulp');
const apps = require('gulp-apps').gulpApps;

interface IMyApp extends IApp {
    dir: string;
    enabled: boolean;
}

const tasks =
    apps.use(gulp).initTasks<IMyApp>([
        {
            name: 'task-1',
            fn: (app) => {
                console.log(app.dir);
            }
        },
        {
            name: 'task-2',
            dependencies: ['task-1'],
            fn: (app, done) => {
                Promise.resolve().then(done);
            }
        },
        {
            name: 'task-3',
            dependencies: ['task-1', 'task-2'],
            fn: () => {
                console.log('hello');
            }
        }
    ]);

tasks.for({
    name: 'firstApp',
    dir: './app1'
});

tasks.forAll([
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

will result in

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


for example:

```
gulp.task('build-enabled', (done) => {
    const myApps = require('./myApps.json') as IMyApp[];

    Promise.all(
        myApps.filter(app => app.enabled)
            .map(app => tasks.for(app).run('my-build-task'))
    )
        .then(done);
});

```
