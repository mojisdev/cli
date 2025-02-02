# @mojis/cli

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]

Mojis CLI is a command-line interface for working with emojis.

> [!NOTE]
> This package can be used by others, but it is not intended to be used directly by end-users.

## 📦 Installation

```bash
npm install @mojis/cli
```

## 🚀 Usage

```ts
import { getSkinTone, hasSkinTone, setSkinTone, setSkinTones } from "@mojis/skin-tone";

console.log(setSkinTone("👍", "dark")); // -> 👍🏿
console.log(setSkinTone("👍", "light")); // -> 👍🏻
console.log(setSkinTone("👍🏻", "none")); // -> 👍

console.log(setSkinTones("👩‍❤️‍👨", ["light", "dark"])); // -> 👩🏻‍❤‍👨🏿

console.log(getSkinTone("👍🏿")); // -> dark
console.log(getSkinTone("👍🏻")); // -> light
console.log(getSkinTone("👍")); // -> none
console.log(getSkinTone("👩🏼‍❤️‍👨🏿")); // -> ["medium-light", "dark"]

console.log(hasSkinTone("👍🏿")); // -> dark
console.log(hasSkinTone("👍🏻")); // -> light
console.log(hasSkinTone("👍")); // -> none
```

## 📄 License

Published under [MIT License](./LICENSE).

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@mojis/cli?style=flat&colorA=18181B&colorB=4169E1
[npm-version-href]: https://npmjs.com/package/@mojis/cli
[npm-downloads-src]: https://img.shields.io/npm/dm/@mojis/cli?style=flat&colorA=18181B&colorB=4169E1
[npm-downloads-href]: https://npmjs.com/package/@mojis/cli
