// StarCraft internal server data example
// © MIT license

const {spawn} = require('child_process')

/** Default options for exec(). */
const defaultOpts = {
  // If 'true', output is logged directly to the log function (process.stdout and process.stderr by default).
  logged: false,
  // Encoding of the command output. If not set, a buffer is returned; otherwise the buffer is decoded into a string.
  encoding: null,
  // Log functions for stdout and stderr.
  logOutFn: (str, encoding = null) => process.stdout.write(str, encoding),
  logErrFn: (str, encoding = null) => process.stderr.write(str, encoding)
}

/** Default options passed to child_process.spawn(). */
const defaultSpawnOpts = {}

/** Encodes a buffer into a string, if an encoding is specified. */
const encode = (buffer, encoding) => {
  if (encoding) {
    return buffer.toString(encoding)
  }
  return buffer
}

const execChar = (cmd, userOpts = {}, userSpawnOpts = {}) => exec(cmd, {...userOpts, encoding: 'utf8'}, userSpawnOpts)

/**
 * Runs an external command and returns an object with the result and exit code.
 *
 * This allows for an external command to be run as a string,
 * as though one is running the command inside of the terminal.
 */
const exec = (cmd, userOpts = {}, userSpawnOpts = {}) => new Promise((resolve, reject) => {
  const opts = {...defaultOpts, ...userOpts}
  const spawnOpts = {...defaultSpawnOpts, ...userSpawnOpts}
  const {logOutFn, logErrFn, logged, encoding} = opts

  const proc = spawn(cmd.slice(0, 1)[0], cmd.slice(1), {...spawnOpts})

  const output = {
    stdout: [],
    stderr: [],
    code: null,
    signal: null,
    error: null
  }

  const finalize = () => {
    return {
      ...output,
      stdout: encode(Buffer.concat(output.stdout), encoding),
      stderr: encode(Buffer.concat(output.stderr), encoding)
    }
  }

  proc.stdout.on('data', (data) => {
    logOutFn && logged && logOutFn(data)
    output.stdout.push(data)
  })

  proc.stderr.on('data', (data) => {
    logErrFn && logged && logErrFn(data)
    output.stderr.push(data)
  })

  proc.on('close', (code, signal) => {
    output.code = code
    output.signal = signal
    return resolve(finalize())
  })

  proc.on('error', (err) => {
    output.error = err
    return reject(finalize())
  })
})

module.exports = {
  exec,
  execChar
}
