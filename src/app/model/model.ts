export interface DataPoint {
  time: string,
  duration: number,
  name: string,
  number: number | null,
  value: string | null
}

export interface Message {
  id?: Identifier,
  time: string,
  status: string,
  sender: Identifier,
  receiver: Identifier,
  tags: string[],
  content: string,
  content_type: string
}

export interface Identifier {
  type: string,
  value: string
}

export interface Person {
  id?: Identifier,
  name: {first: string, middle?: string, last: string},
  identifiers: Identifier[],
  tags?: string[],
  proxy?: {type: string, value: string},
  conversations?: Array<any>,
  tasks?: Array<any>
}

export interface Group {
  id?: Identifier,
  title: string
}

export interface Relation {
  source: Identifier,
  target: Identifier,
  type: string
}

export interface Schedule {
  id?: Identifier,
  name: string,
  action_id?: string,
  timings: Timing[]
}

export interface Timing {
  day: string,
  time: string
}

export interface Ticket {
  id: number,
  open: string,
  close?: string,
  category: string,
  title: string,
  priority: number
}

export enum RelationType {
  admin = 'admin',
  member = 'member'
}
