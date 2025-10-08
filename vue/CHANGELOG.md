# Changelog

## Unreleased

### Added

* Migrate the project to Prime + Tailwind

## [0.10.1](https://gitlab.tooling.live.n-side.com/n-side/energy/energy-gui-lib/-/compare/v0.10.0...v0.10.1)

### Fixed

* Allow `Table` to take a `currentPage` props to enable two way bindings and using apps to control the page form outside of the component.

## [0.10.0](https://gitlab.tooling.live.n-side.com/n-side/energy/energy-gui-lib/-/compare/v0.9.5...v0.10.0)

### Fixed

* Expose a wrapper for Iconify's Icon component that allows usage of offline icons

## [0.9.5](https://gitlab.tooling.live.n-side.com/n-side/energy/energy-gui-lib/-/compare/v0.9.4...v0.9.5)

### Fixed

* Oruga is setting a default page size of 20 rows, unpaginated tables now set the page size to data length to avoid truncation

## [0.9.4](https://gitlab.tooling.live.n-side.com/n-side/energy/energy-gui-lib/-/compare/v0.9.3...v0.9.4)

### Fixed

* Fix Oruga behavior where setting rowsPerPage without enabling pagination would result in truncating the table


## [0.9.3](https://gitlab.tooling.live.n-side.com/n-side/energy/energy-gui-lib/-/compare/v0.9.2...v0.9.3)

### Added

* Offline icon registry using Iconify. Default collections are bundled and automatically registered via `setupDefaultIcons()`. Additional collections can be registered with `registerCollections()`.

## [0.9.2](https://gitlab.tooling.live.n-side.com/n-side/energy/energy-gui-lib/-/compare/v0.9.1...v0.9.2)

### Fixed

* Missing inclusion of `DialogComponent`


## [0.9.1](https://gitlab.tooling.live.n-side.com/n-side/energy/energy-gui-lib/-/compare/v0.9.0...v0.9.1)

### Fixed

* Allow configuration of the `backendStore` as environment variables are compiled in build time

## [0.9.0](https://gitlab.tooling.live.n-side.com/n-side/energy/energy-gui-lib/-/compare/v0.8.2...v0.9.0)

### Added

* Introduce a configurable `backendStore` that manages the backend authentication lifecycle and provides a configured `ApiClient`

## [0.8.2](https://gitlab.tooling.live.n-side.com/n-side/energy/energy-gui-lib/-/compare/v0.8.1...v0.8.2)

### Changed

* Allows `NavBarItem` to take an `action` function instead of a link.

## [0.8.1](https://gitlab.tooling.live.n-side.com/n-side/energy/energy-gui-lib/-/compare/v0.8.0...v0.8.1)

### Fixed

* Allow customization of the Bulma / Oruga-Bulma variables through the exposed main SASS module

## [0.8.0](https://gitlab.tooling.live.n-side.com/n-side/energy/energy-gui-lib/-/compare/v0.7.0...v0.8.0)

### Added

* Add a `Layout` component
* Add a `PaginationComponent` component

### Fixed

* Upgrade dependencies & adapt code to new Sass module system

## [0.7.0](https://gitlab.tooling.live.n-side.com/n-side/energy/energy-gui-lib/-/compare/v0.6.7...v0.7.0)

### Added

* Add `StandardDatePicker` component

## [0.6.7](https://gitlab.tooling.live.n-side.com/n-side/energy/energy-gui-lib/-/compare/v0.6.6...v0.6.7)

### Fixed

* Fix visual bug with `NetworkButton`

## [0.6.6](https://gitlab.tooling.live.n-side.com/n-side/energy/energy-gui-lib/-/compare/v0.6.5...v0.6.6)

### Fixed

* Use older versions of `@oruga-ui/theme-bulma` to be able to enforce `0.9.0-pre.2` on `@oruga-ui/oruga-next`

## [0.6.5](https://gitlab.tooling.live.n-side.com/n-side/energy/energy-gui-lib/-/compare/v0.6.4...v0.6.5)

### Changed

* Modify `@oruga-ui/oruga-next` dependency to specific `0.9.0-pre.2` version to avoid production errors.

## [0.6.4](https://gitlab.tooling.live.n-side.com/n-side/energy/energy-gui-lib/-/compare/v0.6.3...v0.6.4)

### Changed

* Add a `rowKey` prop in `SimpleTableSettingsProps` to allow referencing a unique attribute of row data and avoid default usage of `Crypto: randomUUID()` method


## [0.6.3](https://gitlab.tooling.live.n-side.com/n-side/energy/energy-gui-lib/-/compare/v0.6.2...v0.6.3)

### Changed

* Changed `apiClient` functions to take an optional `maintainState` argument that retains state upon action retriggers

## [0.6.2](https://gitlab.tooling.live.n-side.com/n-side/energy/energy-gui-lib/-/compare/v0.6.1...v0.6.2)

### Fixed

* Mark GET and DELETE calls as `called` once executed in `ApiClient`

## [0.6.1](https://gitlab.tooling.live.n-side.com/n-side/energy/energy-gui-lib/-/compare/v0.6.0...v0.6.1)

### Changed

* Add more customization options to the `NetworkButton`

## [0.6.0](https://gitlab.tooling.live.n-side.com/n-side/energy/energy-gui-lib/-/compare/v0.5.2...v0.6.0)

### Added

* Add a `Snackbar` component

### Changed

* Allow `StandardForm` to be marked as `disabled`, propagating the property to its fields

## [0.5.2](https://gitlab.tooling.live.n-side.com/n-side/energy/energy-gui-lib/-/compare/v0.5.1...v0.5.2)

### Fixed

* Include `NetworkButton` component in dist

## [0.5.1](https://gitlab.tooling.live.n-side.com/n-side/energy/energy-gui-lib/-/compare/v0.5.0...v0.5.1)

### Changed

* `ApiClient` HTTP actions now return the Promise instead of Void to allow applications to wait on it's completion when needed.

## [0.5.0](https://gitlab.tooling.live.n-side.com/n-side/energy/energy-gui-lib/-/compare/v0.4.0...v0.5.0)

### Changed - Breaking ⚠️

* Refactored `apiClient` which is now a configurable `ApiClient` class providing the needed query operations

### Added

* Add new `RouterTabs` component

## [0.4.0](https://gitlab.tooling.live.n-side.com/n-side/energy/energy-gui-lib/-/compare/v0.3.1...v0.4.0)

### Added

* Add new `Tabs` component
* Add `SimpleProgress` field component for the Table
* Add new `Toast` programmatic component

### Changed - Breaking ⚠️

* Renaming of `Simple` to `Base`

## [0.3.1](https://gitlab.tooling.live.n-side.com/n-side/energy/energy-gui-lib/-/compare/v0.3.0...v0.3.1)


### Changed

* Make `SimpleTag` props values optional

### Fixed

* Remove wrong usage of `reactive` in ModalComponent

## [0.3.0](https://gitlab.tooling.live.n-side.com/n-side/energy/energy-gui-lib/-/compare/v0.2.4...v0.3.0)

### Added

* Add API Client

### Changed

* Add `startOpen` prop to `CollapsibleComponent`
* Migrate CSS into dedicated file for `CollapsibleComponent`

## [0.2.4](https://gitlab.tooling.live.n-side.com/n-side/energy/energy-gui-lib/-/compare/v0.2.3...v0.2.4)

### Changed

* Introduce component dedicated stylesheets

## [0.2.3](https://gitlab.tooling.live.n-side.com/n-side/energy/energy-gui-lib/-/compare/v0.2.2...v0.2.3)

### Fixed

* Fix `SimpleTag` to handle internal spacing of icon and text properly

## [0.2.2](https://gitlab.tooling.live.n-side.com/n-side/energy/energy-gui-lib/-/compare/v0.2.1...v0.2.2)

### Changed

* Add an `icon` String

## [0.2.1](https://gitlab.tooling.live.n-side.com/n-side/energy/energy-gui-lib/-/compare/v0.2.0...v0.2.1)

### Fixed

* Include latest components in lib

## [0.2.0](https://gitlab.tooling.live.n-side.com/n-side/energy/energy-gui-lib/-/compare/v0.1.1...v0.2.0)

### Added

* Add new `Collapsible` component
* Add new `StandardTable` component
* Add new `ControlBar` component
* Add new component`DialogComponent` wrapper around `ModalComponent`

### Changed

* Unify library exports based on components folders
* Make Storybook use Oruga and Bulma theme
* Add a `backgroundTransparency` prop to ModalComponent

## [0.1.1](https://gitlab.tooling.live.n-side.com/n-side/energy/energy-gui-lib/-/compare/v0.1.0...v0.1.1)

### Fixed

* Missing configuration prevented generation of `lib.d.ts`


## [0.1.0](https://gitlab.tooling.live.n-side.com/n-side/energy/energy-gui-lib/-/compare/v0.1.0...v0.1.0)

### Changed - Breaking ⚠️

* Update to Bulma v1 deprecates tiles usage and prevent usage with previous Bulma versions
