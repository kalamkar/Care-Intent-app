import {EventEmitter, Injectable, Output} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpParams} from "@angular/common/http";
// @ts-ignore
import {DateTime} from 'luxon';
import {environment} from '../../environments/environment';
import {Observable, of, throwError as observableThrowError} from "rxjs";
import {catchError, map} from "rxjs/operators";
import {Identifier} from "../model/model";

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

  public noCacheDefault = false;
  @Output() activityChange: EventEmitter<boolean> = new EventEmitter();

  private reuestCount = 0;
  private dirtyResources = new Map<string, DateTime>();

  constructor(protected httpClient: HttpClient) {
    this.noCacheDefault = localStorage.getItem('noCacheDefault') === 'true';
  }

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

  public setNoCacheDefault(noCacheDefault: boolean) {
    this.noCacheDefault = noCacheDefault;
    localStorage.setItem('noCacheDefault', noCacheDefault ? 'true' : 'false');
  }

  public getData(source: string, names: string[], start: DateTime, end: DateTime, noCache = this.noCacheDefault): Observable<Array<any>> {
    const url = environment.apiUrl + '/person/' + source + '/data?' + this.encodeQueryData(
      {'name': names, 'start': start.toISO(), 'end': end.toISO()});
    noCache = this.isDirty(source) || noCache;
    return this.get<Array<any>>(url, this.getOptions(noCache), (data: { results: Array<any>; }) => data.results)
  }

  public getDataByTag(source: string, tag: string, noCache = this.noCacheDefault): Observable<Array<any>> {
    const url = environment.apiUrl + '/person/' + source + '/data?' + this.encodeQueryData({'tag': tag});
    noCache = this.isDirty(source) || noCache;
    return this.get<Array<any>>(url, this.getOptions(noCache), (data: { results: Array<any>; }) => data.results)
  }

  public getMessages(source: string, start: DateTime, end: DateTime, bothDirections = false,
                     noCache = this.noCacheDefault): Observable<Array<any>> {
    const params: { [index: string]: string; } = {'start': start.toISO(),  'end': end.toISO()};
    if (bothDirections) {
      params['both'] = '1';
    }
    noCache = this.isDirty(source) || noCache;
    const url = environment.apiUrl + '/person/' + source + '/message?' + this.encodeQueryData(params);
    return this.get<Array<any>>(url, this.getOptions(noCache), (data: { results: Array<any>; }) => data.results)
  }

  public getMessagesByTag(source: string, tag: string, noCache = this.noCacheDefault): Observable<Array<any>> {
    noCache = this.isDirty(source) || noCache;
    const params: { [index: string]: string; } = {tag, 'start': DateTime.fromSeconds(0).toISO(), 'both': '1'};
    const url = environment.apiUrl + '/person/' + source + '/message?' + this.encodeQueryData(params);
    return this.get<Array<any>>(url, this.getOptions(noCache), (data: { results: Array<any>; }) => data.results)
  }

  public getResource(collection: string, id: string, noCache = this.noCacheDefault): Observable<any> {
    noCache = this.isDirty(id) || noCache;
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
    this.setDirty(id);
    const url = environment.apiUrl + '/' + collection + '/' + id;
    return this.patch<any>(url, JSON.stringify(resource),
      this.getOptions(true, {'Content-Type': 'application/json'}));
  }

  public getParents(childId: Identifier, relationType: string, parentType = 'group', noCache = this.noCacheDefault)
        : Observable<Array<any>> {
    noCache = this.isDirty(childId.value) || noCache;
    const url = environment.apiUrl + '/' + parentType +'/all/' + relationType + '/' + childId.value;
    return this.get<Array<any>>(url, this.getOptions(noCache), (data: { results: Array<any>; }) => data.results)
  }

  public getChildren(parentId: Identifier, relationType: string, noCache = this.noCacheDefault): Observable<Array<any>> {
    noCache = this.isDirty(parentId.value) || noCache;
    const url = environment.apiUrl + '/'  + parentId.type + '/' + parentId.value + '/' + relationType;
    return this.get<Array<any>>(url, this.getOptions(noCache), (data: { results: Array<any>; }) => data.results)
  }

  public addRelation(parentId: Identifier, childId: Identifier, relationType: string) {
    this.setDirty(parentId.value);
    this.setDirty(childId.value);
    const url = environment.apiUrl + '/' + parentId.type + '/' + parentId.value + '/' + relationType;
    return this.post<any>(url, JSON.stringify(childId),
      this.getOptions(true, {'Content-Type': 'application/json'}));
  }

  public removeRelation(parentId: Identifier, childId: Identifier, relationType: string) {
    this.setDirty(parentId.value);
    this.setDirty(childId.value);
    const url = environment.apiUrl + '/' + parentId.type + '/' + parentId.value + '/' + relationType + '/'
      + childId.type + ':' + childId.value;
    return this.del<any>(url, this.getOptions(true, {'Content-Type': 'application/json'}));
  }

  public sendProxyMessage(content: string, personId: string, senderId: string) {
    this.setDirty(personId);
    this.setDirty(senderId);
    const url = environment.apiUrl + '/person/' + personId + '/message';
    const action = {
      'id': 'api.coach.proxy.message',
      'type': 'Message',
      'condition': 'True',
      'priority': 10,
      'params': {
        'sender': {'type': 'person', 'value': senderId},
        'receiver': {'type': 'person', 'value': personId},
        'content': content
      }
    };
    return this.post<any>(url, JSON.stringify(
      {'receiver': {'type': 'person', 'value': personId}, 'status': 'internal', 'content': action,
        'content_type': 'application/json'}),
      this.getOptions(true, {'Content-Type': 'application/json'}));
  }

  public sendMessage(content: string, personId: string, phone?: string) {
    this.setDirty(personId);
    const url = environment.apiUrl + '/person/' + personId + '/message';
    const message: any = {'content': content, 'content_type': 'text/plain'};
    if (phone) {
      message['receiver'] = {'type': 'phone', 'value': phone};
    }
    return this.post<any>(url, JSON.stringify(message),
      this.getOptions(true, {'Content-Type': 'application/json'}));
  }

  public addNote(content: string, personId: string) {
    this.setDirty(personId);
    const url = environment.apiUrl + '/person/' + personId + '/message';
    const message: any = {'content': content, 'content_type': 'text/plain', status: 'note', tags: ['session:notes']};
    return this.post<any>(url, JSON.stringify(message),
      this.getOptions(true, {'Content-Type': 'application/json'}));
  }

  public updateSchedule(personId: string) {
    this.setDirty(personId);
    const url = environment.apiUrl + '/person/' + personId + '/message';
    const message: any = {'content': '', 'content_type': 'text/plain', status: 'engage', tags: ['schedule_only']};
    return this.post<any>(url, JSON.stringify(message),
      this.getOptions(true, {'Content-Type': 'application/json'}));
  }

  public closeTicket(ticketId: number, personId: string) {
    this.setDirty(personId);
    const url = environment.apiUrl + '/person/' + personId + '/message';
    const action = {
      'id': 'api.close.ticket',
      'type': 'CloseTicket',
      'condition': 'True',
      'priority': 10,
      'params': {
        'person_id': '$receiver.id',
        'ticket_id': ticketId
      }
    };
    return this.post<any>(url, JSON.stringify(
      {'receiver': {'type': 'person', 'value': personId}, 'status': 'internal', 'content': action,
        'content_type': 'application/json'}),
      this.getOptions(true, {'Content-Type': 'application/json'}));
  }

  public openTicket(category: string, priority: number, title: string, personId: string) {
    this.setDirty(personId);
    const url = environment.apiUrl + '/person/' + personId + '/message';
    const action = {
      'id': 'api.open.ticket',
      'type': 'OpenTicket',
      'condition': 'True',
      'priority': 10,
      'params': {
        'person_id': '$receiver.id',
        'priority': priority,
        'category': category,
        'content': title
      }
    };
    return this.post<any>(url, JSON.stringify(
      {'receiver': {'type': 'person', 'value': personId}, 'status': 'internal', 'content': action,
        'content_type': 'application/json'}),
      this.getOptions(true, {'Content-Type': 'application/json'}));
  }

  public login(id: string, pass: string) {
    const url = environment.authUrl + '/login';
    return this.post<any>(url, JSON.stringify({'identifier': id, 'password': pass}),
      this.getOptions(true, {'Content-Type': 'application/json'}));
  }

  public signup(id: string, pass: string) {
    const url = environment.authUrl + '/signup';
    return this.post<any>(url, JSON.stringify({'identifier': id, 'password': pass}),
      this.getOptions(true, {'Content-Type': 'application/json'}));
  }

  public verify(code: string, pass: string) {
    const url = environment.authUrl + '/verify';
    return this.post<any>(url, JSON.stringify(pass ? {'code': code, 'password': pass} : {'code': code}),
      this.getOptions(true, {'Content-Type': 'application/json'}));
  }

  public recover(id: string) {
    const url = environment.authUrl + '/recover';
    return this.post<any>(url, JSON.stringify({'identifier': id}),
      this.getOptions(true, {'Content-Type': 'application/json'}));
  }

  protected setDirty(resourceId: string) {
    this.dirtyResources.set(resourceId, DateTime.now());
  }

  protected isDirty(resourceId: string): boolean {
    const dirtyTime = this.dirtyResources.get(resourceId);
    if (dirtyTime !== undefined && dirtyTime.diffNow('minutes') > 10) {
      this.dirtyResources.delete(resourceId);
      return false;
    }
    return dirtyTime !== undefined;
  }

  protected get<T>(url: string, options: RequestOptions, mapFxn: any): Observable<T> {
    this.startingRequest(url);
    if (options) {
      return this.httpClient.get<T>(url, options).pipe(
        // @ts-ignore
        map(res => this.extractData(res, url, mapFxn)),
        catchError(err => this.handleError(err))
      );
    }
    return this.httpClient.get(url).pipe(
      // @ts-ignore
      map(res => this.extractData(res, url, mapFxn)),
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

  protected extractData<T>(res: T, url: string, mapFxn: any=null): T {
    this.endedRequest(url);
    return mapFxn ? mapFxn(res) : res;
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
