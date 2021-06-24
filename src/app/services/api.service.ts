import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpParams} from "@angular/common/http";
// @ts-ignore
import {DateTime} from 'luxon';
import {environment} from '../../environments/environment';
import {Observable, of, throwError as observableThrowError} from "rxjs";
import {catchError, map} from "rxjs/operators";

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

  public getResource(collection: string, id: string, noCache = false): Observable<any> {
    const url = environment.apiUrl + '/' + collection + '/' + id;
    return this.get<any>(url, this.getOptions(noCache), null);
  }

  public login(id: string, pass: string) {
    const url = environment.authUrl + '/login';
    return this.post<any>(url, JSON.stringify({'identifier': id, 'password': pass}),
      this.getOptions(true, {'Content-Type': 'application/json'}));
  }

  protected get<T>(url: string, options: RequestOptions, mapFxn: any): Observable<T> {
    if (options) {
      return this.httpClient.get<T>(url, options).pipe(
        // @ts-ignore
        map(res => mapFxn ? mapFxn(res) : this.extractData(res)),
        catchError(err => this.handleError(err))
      );
    }
    return this.httpClient.get(url).pipe(
      // @ts-ignore
      map(res => mapFxn ? mapFxn(res) : this.extractData(res)),
      catchError(err => this.handleError(err))
    );
  }

  protected del<T>(url: string, options: RequestOptions): Observable<T> {
    return this.httpClient.delete<T>(url, options).pipe(
      map(res => this.extractData(res)),
      catchError(err => this.handleError(err))
    );
  }

  protected put<T>(url: string, body: any, options?: RequestOptions): Observable<T> {
    return this.httpClient.put<T>(url, body, options).pipe(
      map(res => this.extractData(res)),
      catchError(err => this.handleError(err))
    );
  }

  protected patch<T>(url: string, body: any, options?: RequestOptions): Observable<T> {
    return this.httpClient.patch<T>(url, body, options).pipe(
      map(res => this.extractData(res)),
      catchError(err => this.handleError(err))
    );
  }

  protected post<T>(url: string, body: any, options?: RequestOptions): Observable<T> {
    return this.httpClient.post<T>(url, body, options).pipe(
      map(res => this.extractData(res)),
      catchError(err => this.handleError(err))
    );
  }

  protected extractData<T>(res: T): T {
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
