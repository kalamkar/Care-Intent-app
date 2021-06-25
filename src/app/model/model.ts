export interface DataPoint {
  time: string,
  duration: number,
  name: string,
  number: number | null,
  value: string | null
}

export interface Message {
  time: string,
  status: string,
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
  identifiers: Identifier[]
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

export enum RelationType {
  adminOf = 'admin_of',
  memberOf = 'member_of'
}
