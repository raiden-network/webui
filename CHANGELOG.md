# Changelog

## [Unreleased]
### Changed
- [#8] Fixes truncation of long token network names.
- [#55] WebUI does not show notification when user opens their first channel.
- [#43] Changes the layout in tokens/channels to make only the entries scrollable.

### Added
- [#31] Add a general `Send Token` button in the channels page.
- [#13] Adds an `Add Funds` button to the Token Card that allows to add funds to the connection manager after joining a 
token network.
- [#34] Adds an address book functionality.

## [0.7.1] - 2019-01-11
### Changed
- [#48] WebUI fails to load on Firefox with Parity due to CORS errors.

## [0.7.0] - 2019-01-04
### Changed
- [#44] Fixes an issue with the types in `TokenInfoRetriever` that would cause issue on amount input.
- [#41] WebUI should allow you to open a channel without any balance.
- [#37] Remove debug events from the WebUI.
- [#9] Optimize the WebUI to handle a great number of tokens.

## [0.6.0] - 2018-12-05
### Changed
- First python package release.

[Unreleased]: https://github.com/raiden-network/webui/compare/v0.7.1...HEAD
[0.7.1]: https://github.com/raiden-network/webui/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/raiden-network/webui/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/raiden-network/webui/releases/tag/v0.6.0

[#55]: https://github.com/raiden-network/webui/issues/55
[#48]: https://github.com/raiden-network/webui/issues/48
[#44]: https://github.com/raiden-network/webui/issues/44
[#43]: https://github.com/raiden-network/webui/issues/43
[#41]: https://github.com/raiden-network/webui/issues/41
[#37]: https://github.com/raiden-network/webui/issues/37
[#34]: https://github.com/raiden-network/webui/issues/34
[#31]: https://github.com/raiden-network/webui/issues/31
[#13]: https://github.com/raiden-network/webui/issues/13
[#9]: https://github.com/raiden-network/webui/issues/9
[#8]: https://github.com/raiden-network/webui/issues/8
