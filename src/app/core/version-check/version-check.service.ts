import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { VersionResponseInterface } from '../../shared/interface/response/version-response.interface';

@Injectable()
export class VersionCheckService {

    private currentHash = '{{POST_BUILD_ENTERS_HASH_HERE}}';
    private refreshMinutes = 3;

    constructor(private http: HttpClient) {
    }

    /**
     * Checks in every set frequency the version of frontend application
     * @param url
     * @param {number} frequency - in milliseconds
     */
    public initVersionCheck(url, frequency = 1000 * 60 * this.refreshMinutes): void {
        setInterval(() => {
            this.checkVersion(url);
        }, frequency);
        this.checkVersion(url);
    }

    /**
     * Will do the call and check if the hash has changed or not
     * @param url
     */
    private checkVersion(url: string): void {
        const currentPath = `${window.location.protocol}//${window.location.hostname}/`;
        this.http.get<VersionResponseInterface>(currentPath + url + '?t=' + new Date().getTime())
            .subscribe(
                (response: VersionResponseInterface) => {
                    const hash = response.hash;
                    const hashChanged = hasHashChanged(this.currentHash, hash);
                    if (hashChanged) {
                        window.location.reload();
                    } else {
                        console.log('No new version is available');
                    }
                    this.currentHash = hash;
                },
                (err) => {
                    console.error(err, 'Could not get version');
                }
            );

        function hasHashChanged(currentHash: string, newHash: string): boolean {
            if (!currentHash || currentHash === '{{POST_BUILD_ENTERS_HASH_HERE}}') {
                return false;
            }
            return currentHash !== newHash;
        }
    }

}
