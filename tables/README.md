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


## Формат `profile.json` для орудия

Минимальный набор полей:

- `name` — отображаемое имя орудия.
- `min_elevation_mil` — минимальный угол возвышения (милы).
- `max_elevation_mil` — максимальный угол возвышения (милы).
- `traverse_sector_deg` — сектор наведения в градусах.
- `heading_center_deg` — азимут центрального направления сектора.
- `ammo_types` — список типов боеприпасов.
- `min_range_m` — минимальная дальность стрельбы (м).
- `max_range_m` — максимальная дальность стрельбы (м).
