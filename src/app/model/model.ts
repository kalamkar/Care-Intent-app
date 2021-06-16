export interface DataPoint {
  time: string,
  duration: number,
  name: string,
  number: number | null
  value: string | null
}

export interface Message {
  time: string,
  status: string,
  tags: string[],
  content: string
  content_type: string
}
