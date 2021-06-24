import { Pipe, PipeTransform } from '@angular/core';
import {Person} from "../model/model";

@Pipe({
  name: 'name'
})
export class NamePipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): string {
    let name = '';
    if (!value) {
      return name;
    }
    if (value instanceof Object && value.hasOwnProperty('name')) {
      const person = value as Person;
      name = person.name ? person.name.first : '';
      name += person.name && person.name.last ? ' ' + person.name.last : '';
    }
    return name;
  }
}
