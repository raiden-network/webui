# Changelog

## [Unreleased]
### Changed
- [#227] Removes non-decimal input for token amounts.
- [#189] Only shows one notification for a channel deposit.

## [0.11.0] - 2019-12-20
### Changed
- [#205] Dialogs can be submitted by pressing enter.
- [#190] Updates the user address when Raiden is restarted with a different address.
- [#218] Fixes the sorting on the tokens and channels pages to not get reset when polling.
- [#141] Only shows the connected tokens in the payment dialog token field.
- [#203] Clears token amount input field on focus.
- [#207] Fixes header content to fit on lower resolutions.

### Added
- [#16] Adds a confirmation dialog for payments which are retried by the user.
- [#18] Shows the error screen when API is down.
- [#12] Adds a token sorting option to show connected networks first.
- [#196] Shows channels while they are being opened.

## [0.10.4] - 2019-12-10
### Changed
- [#212] Fixes a bug that could cause the body parameters of API requests to be wrongly formatted.

## [0.10.3] - 2019-12-06
### Changed
- [#208] Adapts the WebUI to the changed typing of integer values of the Raiden API.

## [0.10.2] - 2019-12-03
### Changed
- [#194] Fixes that no notifications for pending transfers were shown.
- [#179] Shows an error message if ENS is not supported on current network.
- [#184] Fixes showing no notification when initiating a payment.
- [#181] Fixes that the pending transfer notifications were not removed.

## [0.10.1] - 2019-10-22
### Changed
- [#167] Improves the animation of disappearing toast notifications to make it clear where the notification panel is accessible.
- [#171] Fixes the Raiden API not available notification on Firefox to only appear once.
- [#168] Improves notification messages to be more consistent.

### Added
- [#167] Shows toast notifications for new pending actions.
- [#172] Adds a close button to notification panel.
- [#83] Marks balance of newly opened channels as `awaiting` while the deposit is pending.

## [0.10.0] - 2019-09-27
### Changed
- [#144] Fixes channels pagination to update the page immediately.
- [#117] Converts most of the internal numeric values to BigNumber.js instances to prevent overflows.
- [#131] Fixes the instant validation feedback for token amount input when decimals are unchecked.
- [#139] Fixes the paginator to fit material card on mobile.
- [#140] Fixes mobile navigation menu to toggle correctly.
- [#157] Fixes the token symbol to be shortened when it would cause an overlay.
- [#146] Fixes the error screen to appear in case of a rpc error.

### Added
- [#156] Exposes Raiden and WebUI version on About page with a button to copy environment to clipboard.
- [#30] Adds a notification panel which shows pending and finished actions.
- [#16] Adds notifications for in flight payments.

## [0.9.2] - 2019-08-07
### Changed
- [#129] Fixes the address book download to have .json extension on Firefox.
- [#127] Fixes the token page to always refresh connections for showing updated token actions.
- [#29] Changes the polling mechanism to retry requesting after an error occurs.
- [#133] Changes minted token amount to higher value.

## [0.9.1] - 2019-07-26
### Changed
- [#119] Fixes an issue with the flex layout of the token input component.
- [#123] Fixes the animation of the payment dialog to not show the payment identifier expanded.
- [#121] Fixes the token page failing to load the tokens.

## [0.9.0] - 2019-07-24
### Changed
- [#60] Adds layout optimizations for mobile devices.
- [#105] Fixes an issue which prevented the address book download button to work on Firefox.
- [#101] Fixes the reset button of the payment dialog to reset the validity and input values correctly.
- [#5] Changes numeric amounts to be displayed in decimal notation.
- [#87] Fixes the notification for a successful token registration.

### Added
- [#94] Adds withdraw functionality.
- [#79] Adds ens resolution support.
- [#85] Adds account's eth balance on the header.
- [#49] Adds error screen for JSON RPC connection failure.
- [#33] Exposes environment and chain information.
- [#103] Adds instant validation feedback on input fields.
- [#15] Adds a button to the header linking to a faucet on testnets.
- [#11] Adds a token mint button for testnets.
- [#111] Adds payment identifier field to payment dialog.

## [0.8.0] - 2019-01-25
### Changed
- [#66] Fixes an issue where token information would fail to load.
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

[Unreleased]: https://github.com/raiden-network/webui/compare/v0.11.0...HEAD
[0.11.0]: https://github.com/raiden-network/webui/compare/v0.10.4...v0.11.0
[0.10.4]: https://github.com/raiden-network/webui/compare/v0.10.3...v0.10.4
[0.10.3]: https://github.com/raiden-network/webui/compare/v0.10.2...v0.10.3
[0.10.2]: https://github.com/raiden-network/webui/compare/v0.10.1...v0.10.2
[0.10.1]: https://github.com/raiden-network/webui/compare/v0.10.0...v0.10.1
[0.10.0]: https://github.com/raiden-network/webui/compare/v0.9.2...v0.10.0
[0.9.2]: https://github.com/raiden-network/webui/compare/v0.9.1...v0.9.2
[0.9.1]: https://github.com/raiden-network/webui/compare/v0.9.0...v0.9.1
[0.9.0]: https://github.com/raiden-network/webui/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/raiden-network/webui/compare/v0.7.1...v0.8.0
[0.7.1]: https://github.com/raiden-network/webui/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/raiden-network/webui/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/raiden-network/webui/releases/tag/v0.6.0

[#227]: https://github.com/raiden-network/webui/issues/227
[#218]: https://github.com/raiden-network/webui/issues/218
[#212]: https://github.com/raiden-network/webui/issues/212
[#208]: https://github.com/raiden-network/webui/issues/208
[#207]: https://github.com/raiden-network/webui/issues/207
[#205]: https://github.com/raiden-network/webui/issues/205
[#203]: https://github.com/raiden-network/webui/issues/203
[#196]: https://github.com/raiden-network/webui/issues/196
[#194]: https://github.com/raiden-network/webui/issues/194
[#190]: https://github.com/raiden-network/webui/issues/190
[#189]: https://github.com/raiden-network/webui/issues/189
[#184]: https://github.com/raiden-network/webui/issues/184
[#181]: https://github.com/raiden-network/webui/issues/181
[#179]: https://github.com/raiden-network/webui/issues/179
[#172]: https://github.com/raiden-network/webui/issues/172
[#171]: https://github.com/raiden-network/webui/issues/171
[#168]: https://github.com/raiden-network/webui/issues/168
[#167]: https://github.com/raiden-network/webui/issues/167
[#157]: https://github.com/raiden-network/webui/issues/157
[#156]: https://github.com/raiden-network/webui/issues/156
[#146]: https://github.com/raiden-network/webui/issues/146
[#144]: https://github.com/raiden-network/webui/issues/144
[#141]: https://github.com/raiden-network/webui/issues/141
[#140]: https://github.com/raiden-network/webui/issues/140
[#139]: https://github.com/raiden-network/webui/issues/139
[#133]: https://github.com/raiden-network/webui/issues/133
[#131]: https://github.com/raiden-network/webui/issues/131
[#129]: https://github.com/raiden-network/webui/issues/129
[#127]: https://github.com/raiden-network/webui/issues/127
[#123]: https://github.com/raiden-network/webui/issues/123
[#121]: https://github.com/raiden-network/webui/issues/121
[#119]: https://github.com/raiden-network/webui/issues/119
[#117]: https://github.com/raiden-network/webui/issues/117
[#111]: https://github.com/raiden-network/webui/issues/111
[#105]: https://github.com/raiden-network/webui/issues/105
[#103]: https://github.com/raiden-network/webui/issues/103
[#101]: https://github.com/raiden-network/webui/issues/101
[#94]: https://github.com/raiden-network/webui/issues/94
[#87]: https://github.com/raiden-network/webui/issues/87
[#85]: https://github.com/raiden-network/webui/issues/85
[#83]: https://github.com/raiden-network/webui/issues/83
[#79]: https://github.com/raiden-network/webui/issues/79
[#66]: https://github.com/raiden-network/webui/issues/66
[#60]: https://github.com/raiden-network/webui/issues/60
[#55]: https://github.com/raiden-network/webui/issues/55
[#49]: https://github.com/raiden-network/webui/issues/49
[#48]: https://github.com/raiden-network/webui/issues/48
[#44]: https://github.com/raiden-network/webui/issues/44
[#43]: https://github.com/raiden-network/webui/issues/43
[#41]: https://github.com/raiden-network/webui/issues/41
[#37]: https://github.com/raiden-network/webui/issues/37
[#34]: https://github.com/raiden-network/webui/issues/34
[#33]: https://github.com/raiden-network/webui/issues/33
[#31]: https://github.com/raiden-network/webui/issues/31
[#30]: https://github.com/raiden-network/webui/issues/30
[#29]: https://github.com/raiden-network/webui/issues/29
[#18]: https://github.com/raiden-network/webui/issues/18
[#16]: https://github.com/raiden-network/webui/issues/16
[#15]: https://github.com/raiden-network/webui/issues/15
[#13]: https://github.com/raiden-network/webui/issues/13
[#12]: https://github.com/raiden-network/webui/issues/12
[#11]: https://github.com/raiden-network/webui/issues/11
[#9]: https://github.com/raiden-network/webui/issues/9
[#8]: https://github.com/raiden-network/webui/issues/8
[#5]: https://github.com/raiden-network/webui/issues/5
