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
  value: string,
  active?: boolean
}

export interface Person {
  id?: Identifier,
  name: {first: string, middle?: string, last: string},
  identifiers: Identifier[],
  tags?: string[]
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
