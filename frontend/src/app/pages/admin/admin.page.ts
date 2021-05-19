import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from "@angular/forms";

@Component({
    selector: 'app-admin',
    templateUrl: './admin.page.html',
    styleUrls: ['./admin.page.scss'],
})
export class AdminPage implements OnInit {

    availableOptions = [{ name: 'Dao Maker' }, { name: 'test 1' }, { name: 'test 2' }];
    constructor(private fb: FormBuilder) {
        
    }

    ngOnInit() {

    }

    ngOnDestroy() { }


}
