# eslint-plugin-libram

Eslint rules for Libram

## Installation

You'll first need to install [ESLint](http://eslint.org):

```
$ npm i eslint --save-dev
```

Next, install `eslint-plugin-libram`:

```
$ npm install eslint-plugin-libram --save-dev
```

## Usage

Add `libram` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json
{
  "plugins": ["libram"]
}
```

Then configure the rules you want to use under the rules section.

```json
{
  "rules": {
    "libram/rule-name": 2
  }
}
```

## Supported Rules

- Fill in provided rules here
