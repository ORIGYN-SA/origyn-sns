# Dashboard collection visibility

Edit `DISABLED_COLLECTION_IDS` in `src/services/api/gldt/v1/collectionVisibility.ts` to hide or restore a collection by canister ID.
The list currently hides Collection Privée Bochsler, `rm7ew-myaaa-aaaas-qg3uq-cai`.

The dashboard filters collection cards, certificates, search results, collector holdings and history, and NFT transactions.
Direct collection, certificate, and transaction URLs for disabled collections redirect to the viewer in the current language.

Filtering happens in the frontend after each API page loads. Server totals, collector statistics, and offsets remain unchanged, so pages can contain fewer visible results or none.
Pagination remains available on empty filtered pages. The backend and its public data are unchanged.

Run `node --experimental-strip-types scripts/check-collection-visibility.mjs` with Node 22.6 or later to check the filters and pagination behavior.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list
