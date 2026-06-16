// Version constant, exposed for --version flag and TUI footer.

import pkg from '../../package.json' with { type: 'json' }

export const VERSION: string = (pkg as { version: string }).version
export const NAME: string = (pkg as { name: string }).name
