import { Pipe, PipeTransform } from '@angular/core';
import {Group, Person} from "../model/model";

@Pipe({
  name: 'name'
})
export class NamePipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): string {
    let name = '';
    if (!value) {
      return name;
    }
    if (value instanceof Object && value.hasOwnProperty('title')) {
      name = (value as Group).title;
    } else if (value instanceof Object && value.hasOwnProperty('name')) {
      const person = value as Person;
      name = person.name ? person.name.first : '';
      name += person.name && person.name.last ? ' ' + person.name.last : '';
    } else if (value instanceof Object && value.hasOwnProperty('identifiers')) {
      const identifier = (value as Person).identifiers[0];
      if (identifier.type === 'phone') {
        name = 'Phone-' + identifier.value.substr(identifier.value.length - 4);
      }
    }
    return name;
  }
}
