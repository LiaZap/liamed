
export const getImageUrl = (path: string | null | undefined): string | undefined => {
    if (!path) return undefined;
    if (path.startsWith('http')) return path;
    
    let apiUrl = import.meta.env.VITE_API_URL || 'https://liamed-api.leyiy3.easypanel.host';
    
    // Remove /api suffix if present, as uploads are served from root
    if (apiUrl.endsWith('/api')) {
        apiUrl = apiUrl.slice(0, -4);
    }
    
    // Remove trailing slash
    if (apiUrl.endsWith('/')) {
        apiUrl = apiUrl.slice(0, -1);
    }
    
    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    
    return `${apiUrl}${cleanPath}`;
};
