# Gun tables storage

Профили орудий и баллистические таблицы хранятся в `tables`.

Структура:

```text
tables/
  <gun_type>/
    profile.json
    <projectile_name>/
      charge-<N>.json
```

Пример для M777:

```text
tables/
  m777/
    profile.json
    M107_155MM_HE/
      charge-3.json
    M110_SMOKE/
      charge-2.json
```
