# Domain Model

## Сущности

### Battery
Батарея, организационная единица управления огнём.

**Поля:**
- `id`
- `name`
- `status`
- `guns: Gun[]`
- `commanderUserId`

### Gun
Орудие в составе батареи.

**Поля:**
- `id`
- `batteryId`
- `callsign`
- `state`
- `ammoProfiles: AmmoProfile[]`
- `lastKnownPosition`

**Допустимые состояния (`state`):**
- `offline`
- `deploying`
- `ready`
- `firing`
- `resupply`

**Переходы состояний:**
- `offline → deploying` (получена команда на развёртывание)
- `deploying → ready` (орудие развёрнуто и прошло проверку)
- `ready → firing` (подтверждена огневая задача)
- `firing → ready` (огневая задача завершена)
- `ready → resupply` (инициирована дозарядка/пополнение)
- `firing → resupply` (боекомплект исчерпан или требуется срочное пополнение)
- `resupply → ready` (пополнение завершено)
- `deploying → offline` (отмена развёртывания/потеря связи)
- `ready → offline` (вывод из сети/потеря связи)
- `firing → offline` (аварийное отключение/потеря связи)
- `resupply → offline` (потеря связи во время пополнения)

### Observer
Наблюдатель, передающий разведданные и корректировки.

**Поля:**
- `id`
- `callsign`
- `affiliation`
- `position`
- `isOnline`

### Target
Цель для поражения.

**Поля:**
- `id`
- `coordinates`
- `priority`
- `type`
- `createdBy`
- `status`

### FireMission
Огневая задача по одной или нескольким целям.

**Поля:**
- `id`
- `targetId`
- `assignedBatteryId`
- `assignedGunIds`
- `ammoProfileId`
- `status`
- `createdAt`

### Correction
Корректировка огня от наблюдателя.

**Поля:**
- `id`
- `fireMissionId`
- `observerId`
- `delta`
- `comment`
- `createdAt`

### AmmoProfile
Профиль боеприпаса и баллистики для расчёта стрельбы.

**Поля:**
- `id`
- `name`
- `caliber`
- `charge`
- `ballisticTableRef`

### MapLayer
Слой карты (оперативная обстановка, цели, зоны безопасности и т.п.).

**Поля:**
- `id`
- `name`
- `type`
- `visibilityScope`
- `updatedAt`

## Лимиты и масштабирование

Система проектируется под следующие ограничения из запроса:
- до **10 батарей**;
- до **10 орудий на батарею** (итого до 100 орудий);
- до **5 наблюдателей**;
- **многопользовательская работа в реальном времени** с синхронизацией изменений целей, статусов орудий и корректировок.
