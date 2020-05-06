import { Component, OnInit } from '@angular/core';
import { VersionCheckService } from './core/version-check/version-check.service';
import { environment } from '../environments/environment';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    title = 'check-version-test';

    constructor(private versionCheckService: VersionCheckService) {
    }

    ngOnInit(): void {
        this.versionCheckService.initVersionCheck(environment.versionCheckURL);
    }
}
