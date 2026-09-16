/** Build-safe public asset path (works on GitHub Pages subpath and locally). */
export const assetUrl = (path: string): string => {
    const base = import.meta.env.BASE_URL || '/';
    const clean = path.replace(/^\//, '');
    return `${base}${clean}`;
};
