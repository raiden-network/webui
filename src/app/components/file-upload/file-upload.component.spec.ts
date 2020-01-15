import {
    async,
    ComponentFixture,
    fakeAsync,
    flush,
    TestBed,
    tick
} from '@angular/core/testing';

import { FileUploadComponent } from './file-upload.component';
import { stub } from '../../../testing/stub';
import { createTestContacts } from '../../../testing/test-data';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { DragStatus } from '../../directives/drag-upload.directive';

function createMockReader(result: {}) {
    return {
        result: JSON.stringify(result),
        readAsText: function() {
            const progressEvent = stub<ProgressEvent>();
            // @ts-ignore
            progressEvent.loaded = 125;
            // @ts-ignore
            progressEvent.total = 125;
            this.onprogress(progressEvent);
            this.onload();
        },
        onload: () => {},
        onprogress: () => {}
    };
}

function createMockFileList(filename: string = 'address_book.json'): FileList {
    const file = stub<File>();
    // @ts-ignore
    file.name = filename;
    // @ts-ignore
    file.size = 120 * 1024;

    const fileList = stub<FileList>();
    // @ts-ignore
    fileList.length = 1;
    // @ts-ignore
    fileList.item = function() {
        return file;
    };

    return fileList;
}

describe('FileUploadComponent', () => {
    let component: FileUploadComponent;
    let fixture: ComponentFixture<FileUploadComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [FileUploadComponent],
            imports: [MaterialComponentsModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(FileUploadComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should hide the drop area and import the contacts', fakeAsync(function() {
        fixture.detectChanges();

        const reader = window['FileReader'];
        const result = {};
        const data = createTestContacts(2);

        for (let i = 0; i < data.length; i++) {
            result[data[i].address] = data[i].label;
        }

        // @ts-ignore
        window['FileReader'] = class {
            constructor() {
                return createMockReader(result);
            }
        };

        const fileList = createMockFileList();

        component.contacts.subscribe(value => {
            expect(value).toEqual(result);
        });
        component.filesSelected(fileList);
        expect(component.error).toBeNull();
        tick(1000);
        expect(component.showDropArea).toBe(false);

        fixture.detectChanges();
        tick();

        window['FileReader'] = reader;

        flush();
    }));

    it('should have an error if wrong type is passed', fakeAsync(function() {
        fixture.detectChanges();

        const reader = window['FileReader'];
        const result = {};
        const data = createTestContacts(2);

        for (let i = 0; i < data.length; i++) {
            result[data[i].address] = data[i].label;
        }

        // @ts-ignore
        window['FileReader'] = class {
            constructor() {
                return createMockReader(result);
            }
        };

        const fileList = createMockFileList('image.png');

        component.contacts.subscribe(() => {
            fail('should have no contacts on error');
        });

        component.filesSelected(fileList);
        expect(component.error).toEqual({ invalidExtension: true });
        tick(1000);

        fixture.detectChanges();
        tick();

        window['FileReader'] = reader;

        flush();
    }));

    it('should have an error if invalid content is parsed', fakeAsync(function() {
        fixture.detectChanges();

        const reader = window['FileReader'];
        const result = { fake: true, invalid: 'yes' };

        // @ts-ignore
        window['FileReader'] = class {
            constructor() {
                return createMockReader(result);
            }
        };

        const fileList = createMockFileList('address.json');

        component.contacts.subscribe(() => {
            fail('should have no contacts on error');
        });

        component.filesSelected(fileList);
        expect(component.error).toEqual({ invalidFormat: true });
        tick(1000);

        fixture.detectChanges();
        tick();

        window['FileReader'] = reader;

        flush();
    }));

    it('should change to over status when DragStatus.OVER is received', function() {
        expect(component.isOver).toBe(false);
        component.updateDragStatus(DragStatus.OVER);
        expect(component.isOver).toBe(true);
        component.updateDragStatus(DragStatus.LEAVE);
        expect(component.isOver).toBe(false);
    });
});
