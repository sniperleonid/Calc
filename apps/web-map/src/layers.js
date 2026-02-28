export const WEB_MAP_LAYERS = [
  { id: 'guns', title: 'Орудия', visible: true },
  { id: 'observers-drones', title: 'Наблюдатели/дроны', visible: true },
  { id: 'targets', title: 'Цели', visible: true },
  { id: 'safe-zones', title: 'Безопасные зоны', visible: true },
  { id: 'patterns', title: 'Паттерны', visible: false },
  { id: 'rulers', title: 'Линейки', visible: false },
  { id: 'logistics-markers', title: 'Маркеры логистики', visible: true },
  { id: 'mine-markers', title: 'Маркеры мин', visible: true }
];

export function createLayerState(initialLayers = WEB_MAP_LAYERS) {
  const state = new Map(initialLayers.map((layer) => [layer.id, { ...layer }]));

  return {
    getAll: () => [...state.values()],
    setVisibility: (id, visible) => {
      const layer = state.get(id);
      if (!layer) return false;
      layer.visible = visible;
      return true;
    }
  };
}
