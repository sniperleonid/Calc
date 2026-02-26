# ballistics-core

Сервис баллистических расчётов с HTTP API и протоколированием операций.

## Быстрый запуск

```bash
python3 -m uvicorn app:app --host 0.0.0.0 --port 8000
```

> Команду запускать из папки `services/ballistics-core`.

Логи пишутся в:

- `logs/ballistics-core.log`
- `logs/ballistics-core-errors.log`

Протоколы расчётов сохраняются в `data/protocols`.
