/** @deprecated Use skinsService — kept for compatibility */
export {
  fetchSkinFamilies as fetchSkinLines,
  type SkinFamily as SkinLine,
} from './skinsService';

export const getSkinLineById = async (id: number) => {
  const { fetchSkinFamilies } = await import('./skinsService');
  const families = await fetchSkinFamilies();
  return families.find((f) => f.id === id);
};

export const searchSkinLines = async (searchTerm: string) => {
  const { fetchSkinFamilies } = await import('./skinsService');
  const families = await fetchSkinFamilies();
  if (!searchTerm) return families;
  const q = searchTerm.toLowerCase();
  return families.filter((f) => f.name.toLowerCase().includes(q));
};
