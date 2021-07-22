# Capitalize enumerated type constants. (capitalize-constants)

Inconsistent capitalization among enumerated value names is distracting for readers of KoLmafia typescript scripts.

## Rule Details

This rule aims to catch invalid or improperly formatted item, effect, familiar, and monster names.

Examples of **incorrect** code for this rule:

```js
$item`Hair Spray`;
$item`Newbiesport&trade; tent`;
$item`lkjfdsljdf`;
```

Examples of **correct** code for this rule:

```js
$item`hair spray`;
$item`Newbiesport™ tent`;
```

### Options

This rule has an object option:

- `"ignoreCapitalization": true` allows names to be capitalized in any way.
- `"ignoreEntities": true` allows names to use expanded HTML entities, i.e. `&trade;`.
- `"ignoreUnrecognized": true` allows unrecognized value names.
