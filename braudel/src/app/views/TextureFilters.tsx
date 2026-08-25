import React from 'react';

export const TextureFilters: React.FC = () => {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
      <defs>
        {/* Parchemin brut (Antiquité) */}
        <filter id="parchment-rough">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="2" />
          <feColorMatrix type="saturate" values="0.3" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.4" />
          </feComponentTransfer>
        </filter>

        {/* Parchemin doré (Moyen Âge) */}
        <filter id="parchemin-gold">
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="4" seed="7" />
          <feColorMatrix type="matrix" values="0.2 0 0 0 0.5  0 0.2 0 0 0.4  0 0 0.2 0 0.1  0 0 0 0.3 0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
        </filter>

        {/* Parchemin fin (Renaissance) */}
        <filter id="parchment-fine">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="3" />
          <feColorMatrix type="saturate" values="0.15" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.25" />
          </feComponentTransfer>
        </filter>

        {/* Gravure sur cuivre (Moderne) */}
        <filter id="engraving-copper">
          <feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 1 0" result="gray" />
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="5" result="noise" />
          <feDiffuseLighting in="noise" lightingColor="#fff" surfaceScale="2" result="light">
            <feDistantLight azimuth="45" elevation="60" />
          </feDiffuseLighting>
          <feBlend mode="multiply" in="gray" in2="light" />
        </filter>

        {/* Trame circuit (Futuriste) */}
        <filter id="circuit-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Parchemin grain fort (Antiquité & Tolkien High/Dark Fantasy) */}
        <filter id="parchment-coarse">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" seed="4" />
          <feColorMatrix type="saturate" values="0.25" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.35" />
          </feComponentTransfer>
        </filter>

        {/* Papier lourd (Renaissance) */}
        <filter id="paper-heavy">
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" seed="12" />
          <feColorMatrix type="saturate" values="0.2" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3" />
          </feComponentTransfer>
        </filter>

        {/* Papier lisse (Époque Moderne & Tolkien Light Fantasy) */}
        <filter id="paper-smooth">
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="9" />
          <feColorMatrix type="saturate" values="0.1" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.2" />
          </feComponentTransfer>
        </filter>
      </defs>
    </svg>
  );
};
