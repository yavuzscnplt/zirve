import type { ReactElement, ReactNode } from 'react'

// AI çıktısındaki markdown'ı (başlık, kalın/italik, liste, tablo, alıntı,
// yatay çizgi, kod) harici bağımlılık olmadan render eder. Tam CommonMark
// değil; modelin ürettiği alt kümeyi kapsar.

function inline(text: string, base: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const re = /\*\*([^*]+)\*\*|__([^_]+)__|`([^`]+)`|\*([^*]+)\*/g
  let last = 0
  let i = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    if (m[1] != null) nodes.push(<strong key={`${base}-${i}`}>{m[1]}</strong>)
    else if (m[2] != null) nodes.push(<strong key={`${base}-${i}`}>{m[2]}</strong>)
    else if (m[3] != null) nodes.push(<code key={`${base}-${i}`}>{m[3]}</code>)
    else if (m[4] != null) nodes.push(<em key={`${base}-${i}`}>{m[4]}</em>)
    last = re.lastIndex
    i++
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

function isTableSep(line: string): boolean {
  return line.includes('-') && /^\s*\|?[\s:|-]+\|?\s*$/.test(line)
}

function splitRow(line: string): string[] {
  let s = line.trim()
  if (s.startsWith('|')) s = s.slice(1)
  if (s.endsWith('|')) s = s.slice(0, -1)
  return s.split('|').map((c) => c.trim())
}

const isHeading = (l: string): boolean => /^\s*#{1,6}\s+/.test(l)
const isHr = (l: string): boolean => /^\s*(---|\*\*\*|___)\s*$/.test(l)
const isUl = (l: string): boolean => /^\s*[-*]\s+/.test(l)
const isOl = (l: string): boolean => /^\s*\d+\.\s+/.test(l)
const isQuote = (l: string): boolean => /^\s*>\s?/.test(l)

export function Markdown({ text, className }: { text: string; className?: string }): ReactElement {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.trim() === '') {
      i++
      continue
    }

    if (isHr(line)) {
      blocks.push(<hr key={key++} className="md__hr" />)
      i++
      continue
    }

    const h = line.match(/^\s*(#{1,6})\s+(.*)$/)
    if (h) {
      const level = h[1].length
      const kids = inline(h[2], `h${key}`)
      if (level <= 1) blocks.push(<h3 key={key++} className="md__h md__h1">{kids}</h3>)
      else if (level === 2) blocks.push(<h4 key={key++} className="md__h md__h2">{kids}</h4>)
      else blocks.push(<h5 key={key++} className="md__h md__h3">{kids}</h5>)
      i++
      continue
    }

    // GFM tablo
    if (line.includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const header = splitRow(line)
      i += 2
      const rows: string[][] = []
      while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') {
        rows.push(splitRow(lines[i]))
        i++
      }
      const tk = key++
      blocks.push(
        <div className="md__tablewrap" key={tk}>
          <table className="md__table">
            <thead>
              <tr>{header.map((c, ci) => <th key={ci}>{inline(c, `th${tk}-${ci}`)}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri}>{r.map((c, ci) => <td key={ci}>{inline(c, `td${tk}-${ri}-${ci}`)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      continue
    }

    if (isQuote(line)) {
      const buf: string[] = []
      while (i < lines.length && isQuote(lines[i])) {
        buf.push(lines[i].replace(/^\s*>\s?/, ''))
        i++
      }
      blocks.push(<blockquote key={key++} className="md__quote">{inline(buf.join(' '), `q${key}`)}</blockquote>)
      continue
    }

    if (isUl(line)) {
      const items: string[] = []
      while (i < lines.length && isUl(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ''))
        i++
      }
      const lk = key++
      blocks.push(
        <ul key={lk} className="md__ul">
          {items.map((it, ii) => <li key={ii}>{inline(it, `li${lk}-${ii}`)}</li>)}
        </ul>
      )
      continue
    }

    if (isOl(line)) {
      const items: string[] = []
      while (i < lines.length && isOl(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''))
        i++
      }
      const lk = key++
      blocks.push(
        <ol key={lk} className="md__ol">
          {items.map((it, ii) => <li key={ii}>{inline(it, `oli${lk}-${ii}`)}</li>)}
        </ol>
      )
      continue
    }

    // paragraf: ardışık düz satırları birleştir
    const buf: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !isHeading(lines[i]) &&
      !isHr(lines[i]) &&
      !isUl(lines[i]) &&
      !isOl(lines[i]) &&
      !isQuote(lines[i]) &&
      !(lines[i].includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1]))
    ) {
      buf.push(lines[i])
      i++
    }
    blocks.push(<p key={key++} className="md__p">{inline(buf.join(' '), `p${key}`)}</p>)
  }

  return <div className={className ? `md ${className}` : 'md'}>{blocks}</div>
}
