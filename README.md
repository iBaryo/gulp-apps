# gulp-apps
running same gulp tasks for multiple apps

```
const gulp = require('gulp');
const gulpApps = require('gulp-apps');

gulp.task('default', () => {
    const initTasks = gulpApps.use(gulp)
        .initTasks([
            {
                name: '1',
                fn: (app, done) => {
                    console.log(app);
                    done();
                }
            },
            {
                name: '2',
                dependencies: [
                    '1'
                ],
                fn: ()=> {console.log('done');}
            },
            {
                name: '3',
                dependencies: [
                    '2'
                ],
                fn: ()=>Promise.resolve(42)
            }
        ]);

    const apps = [
        {
            name: 'myApp1'
        },
        {
            name: 'myApp2'
        }
    ];

    return Promise.all(
        apps.map(app => initTasks.for(app).run('3'))
    );
});
```
