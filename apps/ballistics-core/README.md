# Ballistics core module

This is a standalone launcher ballistics module (no UI dependencies).

## Data source

Weapon profiles and ballistic tables are loaded dynamically from the repository `tables/` folder via UI server API:

- `GET /api/ballistics/weapon?weaponId=<gun>/<projectile>`
- `GET /api/ballistics/table?path=<gun>/<projectile>/<table>.npz`

Server-side lookup root is `tables/`.

Expected structure:

```text
tables/
  <gun>/
    profile.json
    <projectile>/
      *.npz
```

Adding a new weapon/table should require only new files in `tables/`.
