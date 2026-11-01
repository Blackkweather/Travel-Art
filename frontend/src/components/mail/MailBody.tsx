import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { t } from '@/i18n'

/**
 * A message body as it was received, inside a sandbox.
 *
 * Anyone can write to the inbox, so the HTML here is a stranger's. It is never
 * put into the page itself. It goes into an iframe whose sandbox grants no
 * scripts, no forms and no top-level navigation, and whose own
 * Content-Security-Policy loads nothing from the network:
 *
 *   - no script runs, inline or otherwise, and neither does an onerror=;
 *   - no remote image loads, so a tracking pixel never tells the sender that
 *     the message was opened, or from where. Embedded images arrive from the
 *     server as data: URIs and still display;
 *   - links open in a new tab, outside the sandbox, and only http, https,
 *     mailto and tel links stay clickable.
 *
 * allow-same-origin is what lets this component measure the document to size
 * the frame. It is safe only because allow-scripts is absent: with both, the
 * message could reach into the console. Never add allow-scripts here.
 */

const FRAME_CSP = "default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src data:"

function framed(html: string): string {
  // A meta refresh would navigate the frame to a page of the sender's choosing.
  const body = html.replace(/<meta[^>]+http-equiv\s*=\s*["']?refresh[^>]*>/gi, '')
  const head =
    `<meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${FRAME_CSP}">` +
    '<base target="_blank">' +
    '<style>html,body{margin:0;padding:0;background:#fff;color:#14161A;font-family:Helvetica,Arial,sans-serif;' +
    'font-size:14px;line-height:1.5;word-wrap:break-word;overflow-wrap:anywhere}img{max-width:100%;height:auto}' +
    'table{max-width:100%}blockquote{margin:0 0 0 .5em;padding-left:.75em;border-left:3px solid #E7E1D8;color:#5A6478}</style>'
  // Ours goes first: the first <base> and the first CSP a document meets are
  // the ones that hold, whatever the message declares after them.
  return /<head[^>]*>/i.test(body) ? body.replace(/<head[^>]*>/i, (open) => `${open}${head}`) : `<!doctype html><html><head>${head}</head><body>${body}</body></html>`
}

const SAFE_LINK = /^(https?:|mailto:|tel:)/i

interface MailBodyProps {
  html: string | null
  text: string | null
}

export default function MailBody({ html, text }: MailBodyProps) {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const observerRef = useRef<ResizeObserver | null>(null)
  const [height, setHeight] = useState(160)
  const doc = useMemo(() => (html ? framed(html) : null), [html])
  const hidesRemoteImages = useMemo(() => Boolean(html && /<img[^>]+src\s*=\s*["']?https?:/i.test(html)), [html])

  const measure = useCallback(() => {
    const d = frameRef.current?.contentDocument
    if (!d?.documentElement) return
    setHeight(Math.min(Math.max(d.documentElement.scrollHeight, 60), 20000) + 4)
  }, [])

  const onLoad = useCallback(() => {
    const d = frameRef.current?.contentDocument
    if (!d) return
    d.querySelectorAll('a').forEach((a) => {
      const href = a.getAttribute('href') ?? ''
      if (!SAFE_LINK.test(href.trim())) {
        a.removeAttribute('href')
        return
      }
      a.setAttribute('target', '_blank')
      a.setAttribute('rel', 'noopener noreferrer')
    })
    measure()
    // Fonts and embedded images can still grow the document after load.
    observerRef.current?.disconnect()
    if (d.body && typeof ResizeObserver !== 'undefined') {
      observerRef.current = new ResizeObserver(measure)
      observerRef.current.observe(d.body)
    }
  }, [measure])

  useEffect(() => () => observerRef.current?.disconnect(), [])

  if (!doc) {
    return (
      <div className="whitespace-pre-wrap break-words text-[0.9375rem] leading-relaxed text-content">
        {text?.trim() || <span className="text-content-secondary">{t('(message vide)')}</span>}
      </div>
    )
  }

  return (
    <div>
      <iframe
        ref={frameRef}
        title={t('Contenu du message')}
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        srcDoc={doc}
        onLoad={onLoad}
        style={{ height }}
        className="block w-full rounded-control border-0 bg-white"
      />
      {hidesRemoteImages && (
        <p className="mt-2 text-xs text-content-secondary">
          {t('Les images hébergées à l’extérieur ne sont pas chargées, pour que l’expéditeur ne sache pas quand vous lisez.')}
        </p>
      )}
    </div>
  )
}
