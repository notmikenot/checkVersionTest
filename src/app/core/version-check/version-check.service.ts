import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { VersionResponseInterface } from '../../shared/interface/response/version-response.interface';

@Injectable()
export class VersionCheckService {

    private currentVersion = '{{POST_BUILD_ENTERS_HASH_HERE}}';
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
        this.http.get<VersionResponseInterface[]>(currentPath + url + '?t=' + new Date().getTime())
            .subscribe(
                (response: VersionResponseInterface[]) => {
                    const lastVersion = getLastVersionByDate(response);
                    const hashChanged = hasVersionChanged(this.currentVersion, lastVersion);
                    if (hashChanged) {
                        console.log('Nuova versione disponibile (v.' + lastVersion + ')');
                        // window.location.reload();
                    } else {
                        console.log('L\'applicazione è aggiornata (v.' + lastVersion + ')');
                    }
                    this.currentVersion = lastVersion;
                },
                (err) => {
                    console.error(err, 'Impossibile trovare la versione');
                }
            );

        function hasVersionChanged(currentVersion: string, newVersion: string): boolean {
            if (!currentVersion || currentVersion === '{{POST_BUILD_ENTERS_HASH_HERE}}') {
                return false;
            }
            return currentVersion !== newVersion;
        }

        function getLastVersionByDate(hashes: VersionResponseInterface[]): string {
            if (hashes) {
                return hashes.sort(dateSorter)[hashes.length - 1].version;
            }
        }
    }

}

export function dateSorter(a: VersionResponseInterface, b: VersionResponseInterface) {
    if (a.date < b.date) {
        return 1;
    }
    if (a.date > b.date) {
        return -1;
    }
    return 0;
}
