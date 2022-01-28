[![MIT license](https://img.shields.io/badge/license-MIT-brightgreen.svg)](https://opensource.org/licenses/MIT)

# bnetdata

Utility for querying Battle.net information through the StarCraft internal program API.

## Usage

After installation, see `bnetdata --help` for usage information:

```
usage: bnetdata [-h] [-v] [-d] [--get-port] [--get-process] [--get-ladder-top100]
                [--get-player BNET_ID] [--find-players TERM] [--host HOST]

Retrieves data from StarCraft's internal webserver.

optional arguments:
  -h, --help            show this help message and exit
  -v, --version         show program's version number and exit
  -d, --debug           turns debugging on (logs the API calls being made)
  --get-port            prints the port currently used by StarCraft
  --get-process         prints the process ID currently used by StarCraft
  --get-ladder-top100   prints the current global ladder top 100
  --get-player BNET_ID  prints player information by Battle.net ID
  --find-players TERM   searches the ladder for a name and returns matching players
  --host HOST           host to use for making API calls (default: 127.0.0.1)
```

To use the program, StarCraft: Remastered must be running, as all queries are actually taken from its internal webserver.

Requires a Unix like environment to be present at the moment. Untested on Windows, but I think it should work if the WSL is present.

## License

MIT license
