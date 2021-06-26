import {EventEmitter, Injectable, Output} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpParams} from "@angular/common/http";
// @ts-ignore
import {DateTime} from 'luxon';
import {environment} from '../../environments/environment';
import {Observable, of, throwError as observableThrowError} from "rxjs";
import {catchError, map} from "rxjs/operators";
import {Identifier, Relation} from "../model/model";

export interface RequestOptions {
  headers?: HttpHeaders | {
    [header: string]: string | string[];
  };
  observe?: 'body';
  params?: HttpParams | {
    [param: string]: string | string[];
  };
  reportProgress?: boolean;
  withCredentials?: boolean;
}


@Injectable({
  providedIn: 'root'
})
export class ApiService {

  @Output() activityChange: EventEmitter<boolean> = new EventEmitter();

  private reuestCount = 0;

  constructor(protected httpClient: HttpClient) { }

  public static getPipedObservable(observable: any): Observable<{ response: any, success: boolean }> {
    return observable.pipe(
      map(res => ({response: res, success: true})),
      catchError(err => {
        return of({error: err, success: false});
      })
    );
  }

  onRequestError(error: HttpErrorResponse | any): void {
    this.endedRequest(error.url);
    console.log(error);
  }

  public getData(source: string, names: string[], start: DateTime, end: DateTime): Observable<Array<any>> {
    const url = environment.apiUrl + '/data/' + source + '?' + this.encodeQueryData(
      {'name': names, 'start': start.toISO(), 'end': end.toISO()});
    return this.get<Array<any>>(url, this.getOptions(false), (data: { rows: Array<any>; }) => data.rows)
  }

  public getMessages(source: string, start: DateTime, end: DateTime): Observable<Array<any>> {
    const url = environment.apiUrl + '/messages/' + source+ '?' + this.encodeQueryData(
      {'start': start.toISO(),  'end': end.toISO()});
    return this.get<Array<any>>(url, this.getOptions(false), (data: { rows: Array<any>; }) => data.rows)
  }

  public getResource(collection: string, id: string, noCache = true): Observable<any> {
    const url = environment.apiUrl + '/' + collection + '/' + id;
    return this.get<any>(url, this.getOptions(noCache), null);
  }

  public addResource(collection: string, resource: any): Observable<any> {
    const url = environment.apiUrl + '/' + collection;
    return this.post<any>(url, JSON.stringify(resource),
      this.getOptions(true, {'Content-Type': 'application/json'}));
  }

  public editResource(collection: string, resource: any): Observable<any> {
    const id = resource.id.value;
    delete resource.id;
    const url = environment.apiUrl + '/' + collection + '/' + id;
    return this.patch<any>(url, JSON.stringify(resource),
      this.getOptions(true, {'Content-Type': 'application/json'}));
  }

  public query(relation: string, resourceType: string, resourceId: Identifier): Observable<Array<any>> {
    const url = environment.apiUrl + '/query?' + this.encodeQueryData(
      {'resource': resourceId.type + ':' + resourceId.value,  'resource_type': resourceType, 'relation_type': relation});
    return this.get<Array<any>>(url, this.getOptions(true), (data: { results: Array<any>; }) => data.results)
  }

  public addRelation(relation: Relation) {
    const url = environment.apiUrl + '/relate';
    return this.post<any>(url, JSON.stringify(relation),
      this.getOptions(true, {'Content-Type': 'application/json'}));
  }

  public login(id: string, pass: string) {
    const url = environment.authUrl + '/login';
    return this.post<any>(url, JSON.stringify({'identifier': id, 'password': pass}),
      this.getOptions(true, {'Content-Type': 'application/json'}));
  }

  protected get<T>(url: string, options: RequestOptions, mapFxn: any): Observable<T> {
    this.startingRequest(url);
    if (options) {
      return this.httpClient.get<T>(url, options).pipe(
        // @ts-ignore
        map(res => mapFxn ? mapFxn(res) : this.extractData(res, url)),
        catchError(err => this.handleError(err))
      );
    }
    return this.httpClient.get(url).pipe(
      // @ts-ignore
      map(res => mapFxn ? mapFxn(res) : this.extractData(res, url)),
      catchError(err => this.handleError(err))
    );
  }

  protected del<T>(url: string, options: RequestOptions): Observable<T> {
    this.startingRequest(url);
    return this.httpClient.delete<T>(url, options).pipe(
      map(res => this.extractData(res, url)),
      catchError(err => this.handleError(err))
    );
  }

  protected put<T>(url: string, body: any, options?: RequestOptions): Observable<T> {
    this.startingRequest(url);
    return this.httpClient.put<T>(url, body, options).pipe(
      map(res => this.extractData(res, url)),
      catchError(err => this.handleError(err))
    );
  }

  protected patch<T>(url: string, body: any, options?: RequestOptions): Observable<T> {
    this.startingRequest(url);
    return this.httpClient.patch<T>(url, body, options).pipe(
      map(res => this.extractData(res, url)),
      catchError(err => this.handleError(err))
    );
  }

  protected post<T>(url: string, body: any, options?: RequestOptions): Observable<T> {
    this.startingRequest(url);
    return this.httpClient.post<T>(url, body, options).pipe(
      map(res => this.extractData(res, url)),
      catchError(err => this.handleError(err))
    );
  }

  protected extractData<T>(res: T, url: string): T {
    this.endedRequest(url);
    return res;
  }

  /**
   * Handle HTTP error
   */
  protected handleError(error: HttpErrorResponse | any): Observable<never> {
    this.onRequestError(error);

    let errMsg: string;
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      errMsg = 'An error occurred: ' + error.error.message;
    } else {
      try {
        errMsg = error.status + ' ' + error.error.title;
      } catch (e) {
        errMsg = (error.error.message) ? error.error.message :
          error.status ? `${error.status} - ${error.statusText}` : 'Server error';
      }
    }
    console.error(errMsg);
    return observableThrowError(error);
  }

  private startingRequest(name: string) {
    this.reuestCount++;
    if (this.reuestCount === 1) {
      this.activityChange.emit(true);
    }
  }

  private endedRequest(name: string) {
    this.reuestCount--;
    if (this.reuestCount <= 0) {
      this.reuestCount = 0;
      this.activityChange.emit(false);
    }
  }


  getOptions(noCache = true, extraHeaders?: { [index: string]: string; }): RequestOptions {
    let headers = new HttpHeaders({});
    const authStr = localStorage.getItem('auth');
    const auth = authStr ? JSON.parse(authStr) : null;
    if (auth && auth.token) {
      headers = headers.append('Authorization', 'Bearer ' + auth.token);
    }
    if (noCache) {
      headers = headers.append('Pragma', 'no-cache');
      headers = headers.append('Cache-Control', ['no-cache', 'max-age=0', 'max-stale=0', 'private']);
      headers = headers.append('Expires', DateTime.utc().minus({seconds: 60}).toHTTP());
    } else {
      headers = headers.append('Cache-Control', 'private');
    }
    if (extraHeaders) {
      for (const name in extraHeaders) {
        if (extraHeaders.hasOwnProperty(name)) {
          headers = headers.append(name, extraHeaders[name]);
        }
      }
    }
    return {headers, withCredentials: true};
  }

  encodeQueryData(dict: { [index: string]: any; }): string {
    const params: Array<string> = [];
    for (const name in dict) {
      if (dict.hasOwnProperty(name)) {
        if (dict[name] instanceof Array) {
          dict[name].forEach((val: any) => params.push(encodeURIComponent(name) + '=' + encodeURIComponent(val)));
        } else {
          params.push(encodeURIComponent(name) + '=' + encodeURIComponent(dict[name]));
        }
      }
    }
    return params.join('&');
  }
}
