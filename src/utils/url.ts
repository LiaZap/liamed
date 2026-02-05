
export const getImageUrl = (path: string | null | undefined): string | undefined => {
    if (!path) return undefined;
    if (path.startsWith('http')) return path;
    
    let apiUrl = import.meta.env.VITE_API_URL || 'https://liamed-api.leyiy3.easypanel.host';
    
    // Normalize URL: Remove trailing slashes and /api suffix to get the root domain
    apiUrl = apiUrl.replace(/\/+$/, ''); // Remove trailing slashes first
    if (apiUrl.endsWith('/api')) {
        apiUrl = apiUrl.slice(0, -4); // Remove /api
    }
    apiUrl = apiUrl.replace(/\/+$/, ''); // Remove any remaining trailing slash
    
    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    
    return `${apiUrl}${cleanPath}`;
};
