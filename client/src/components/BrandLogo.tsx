import { getTenantBrandingConfig, getNamespacedItem, normalizeLogoUrl } from "../config/theme";

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  light?: boolean;
  forcePlatformLogo?: boolean;
}

export default function BrandLogo({ size = 'md', light = false, forcePlatformLogo = false }: BrandLogoProps) {
  const height = size === 'sm' ? 28 : size === 'md' ? 48 : 72;
  const useTenantBranding = !forcePlatformLogo && getTenantBrandingConfig();
  const customLogo = useTenantBranding ? normalizeLogoUrl(getNamespacedItem('theme_logo_url')) : null;
  
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <img 
        src={customLogo || "/logo.png"} 
        alt="Jioplix Logo" 
        style={{ 
          height: `${height}px`, 
          width: 'auto',
          display: 'block',
          mixBlendMode: light ? 'normal' : 'multiply',
          filter: light ? 'none' : 'brightness(1.05) contrast(1.1)'
        }} 
      />
    </div>
  );
}
