# Master
  * Add `npm run build:docker` command to build a properly tagged docker image
  * **BREAKING**: Remove `NODE_TLS_REJECT_UNAUTHORIZED` from the source code. To allow non valid SSL certs, please set this variable to `0` in your env
  * Introduce `MAX_REQUEST_SIZE` and `MAX_REQUEST_TIME` in code to eliminate a DoS attack vector [#117](devteamreims/4ME#117)

# v0.1.2
  * Add npm-check script and integrates with gitlab-ci [#115](devteamreims/4ME#115)/[#45](devteamreims/4ME#45)
  * More straightforward release mechanism using `npm version`
  * Remove david-dm badge from README in favor of gitlab-ci badge

# 0.1.1
* Initial version
