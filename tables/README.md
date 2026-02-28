# Gun tables storage

Профили орудий, профили снарядов и баллистические таблицы хранятся в `tables`.

Структура:

```text
tables/
  <gun_type>/
    profile.json
    <projectile_name>/
      profile.json
      *.npz
```

Где:

- `tables/<gun_type>/profile.json` — профиль орудия.
- `tables/<gun_type>/<projectile_name>/profile.json` — профиль снаряда.
- `tables/<gun_type>/<projectile_name>/*.npz` — баллистические таблицы этого снаряда.

Пример для M777:

```text
tables/
  M777/
    profile.json
    M107_155MM_HE/
      profile.json
      ballistic_direct.npz
      ballistic_low.npz
      ballistic_high.npz
```
