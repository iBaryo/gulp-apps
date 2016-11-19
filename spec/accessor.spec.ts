
import {gulpApps} from "../src/accessor";
import {IApp} from "../src/interfaces";
import {AppTasks} from "../src/gulpApps";
describe('accessor', () => {
    let mockGulp;

    beforeEach(() => {
        mockGulp = {
            task: jasmine.createSpy('gulp task spy')
        };
    });
    it('dummy', () => {
        expect(gulpApps).toBeTruthy();
    });

    it('should init with gulp and prepare for init tasks', () => {
        expect(gulpApps.use(mockGulp)).toBeTruthy();
        expect(gulpApps.use(mockGulp).initTasks).toBeTruthy();
    });

    it('should init tasks', () => {
        const appTasks = gulpApps.use(mockGulp).initTasks<IApp>([]);

        expect(appTasks).toEqual(jasmine.any(AppTasks));
    });
});