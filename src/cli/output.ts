import type { CliContext } from './context.js'

let stdoutStream: NodeJS.WritableStream = process.stdout
let stderrStream: NodeJS.WritableStream = process.stderr

export function setOutputStream(stdout: NodeJS.WritableStream, stderr: NodeJS.WritableStream) {
  stdoutStream = stdout
  stderrStream = stderr
}

function writeOut(message: string): void {
  stdoutStream.write(`${message}\n`)
}

function writeErr(message: string): void {
  stderrStream.write(`${message}\n`)
}

export function logInfo(ctx: CliContext, message: string): void {
  const prefix = ctx.output.color ? ctx.colors.muted(ctx.prefix.info) : ctx.prefix.info
  writeErr(`${prefix}${message}`)
}

export function logError(ctx: CliContext, message: string): void {
  const prefix = ctx.output.color ? ctx.colors.error(ctx.prefix.err) : ctx.prefix.err
  writeErr(`${prefix}${message}`)
}

export function logVerbose(ctx: CliContext, message: string): void {
  if (!ctx.output.verbose) return
  writeErr(`${ctx.colors.muted('→')} ${ctx.colors.muted(message)}`)
}

export function logDebug(ctx: CliContext, message: string, data?: unknown): void {
  if (!ctx.output.debug) return
  writeErr(`${ctx.colors.muted('[debug]')} ${message}`)
  if (data !== undefined) {
    const formatted = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
    for (const line of formatted.split('\n')) {
      writeErr(`${ctx.colors.muted('[debug]')}   ${line}`)
    }
  }
}

export function output(message: string): void {
  writeOut(message)
}
