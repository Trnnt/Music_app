import { useState, useEffect } from 'react';
import { Buffer } from 'buffer';
import * as jpeg from 'jpeg-js';

// Provide a stable, fallback geometric color suite just in case.
const defaultColors = {
  background: '#121212',
  primary: '#FFFFFF',
  secondary: '#1f1f1f',
  detail: '#b3b3b3',
};

export type ExtractedColors = {
  background: string;
  primary: string;
  secondary: string;
  detail: string;
};

// Helper to convert RGB to beautiful HSL for our UI elements
function rgbToHslColors(r: number, g: number, b: number): ExtractedColors {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  
  const hue = Math.round(h * 360);
  return {
    background: `hsl(${hue}, 40%, 10%)`,
    primary: `hsl(${hue}, 80%, 65%)`,
    secondary: `hsl(${hue}, 30%, 45%)`,
    detail: `hsl(${hue}, 90%, 80%)`,
  };
}

export function useImageColors(imageUrl: string | undefined, fallbackHash?: string) {
  const [colors, setColors] = useState<ExtractedColors>(defaultColors);

  useEffect(() => {
    let isMounted = true;

    if (!imageUrl) {
      // For local songs with no artwork, generate unique colors from fallbackHash
      if (fallbackHash) {
        let hash = 0;
        for (let i = 0; i < fallbackHash.length; i++) {
          hash = fallbackHash.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash) % 360;
        if (isMounted) {
          setColors({
            background: `hsl(${hue}, 40%, 10%)`,
            primary: `hsl(${hue}, 80%, 65%)`,
            secondary: `hsl(${hue}, 30%, 45%)`,
            detail: `hsl(${hue}, 90%, 80%)`,
          });
        }
      } else {
        setColors(defaultColors);
      }
      return;
    }

    const fetchTrueColors = async () => {
      try {
        // Optimize fetching: if it's an iTunes URL (600x600), swap to 100x100 for blazing fast JS decoding
        const tinyUrl = imageUrl.replace('600x600bb.jpg', '100x100bb.jpg').replace('1000x1000bb.jpg', '100x100bb.jpg');
        
        // 1. Fetch raw image bytes from network
        const response = await fetch(tinyUrl);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // 2. Decode JPEG purely in Javascript (Zero Native Modules, 100% Expo Go Safe!)
        const rawImageData = jpeg.decode(buffer, { useTArray: true });
        const data = rawImageData.data; // RGBA array
        
        // 3. Spotify-style Hue Binning Algorithm
        // We bin pixels into 36 color groups to find the most 'vibrant' dominant color, ignoring pure blacks/whites
        const hueBins = new Array(36).fill(0);
        const rgbBins = new Array(36).fill(null).map(() => ({r:0, g:0, b:0, count:0}));

        // Sample every 16th pixel to save CPU milliseconds
        for (let i = 0; i < data.length; i += 64) {
           const pr = data[i], pg = data[i+1], pb = data[i+2];
           
           const max = Math.max(pr, pg, pb), min = Math.min(pr, pg, pb);
           if (max < 30 || (max - min) < 15) continue; // Skip shadows and muddy greys
           
           let h = 0;
           if (max === pr) h = (pg - pb) / (max - min);
           else if (max === pg) h = 2.0 + (pb - pr) / (max - min);
           else h = 4.0 + (pr - pg) / (max - min);
           h *= 60;
           if (h < 0) h += 360;
           
           const bin = Math.floor(h / 10) % 36;
           hueBins[bin]++;
           rgbBins[bin].r += pr;
           rgbBins[bin].g += pg;
           rgbBins[bin].b += pb;
           rgbBins[bin].count++;
        }
        
        // 4. Find the winning color bin
        let bestBin = 0;
        let maxCount = 0;
        for (let i = 0; i < 36; i++) {
           if (hueBins[i] > maxCount) {
               maxCount = hueBins[i];
               bestBin = i;
           }
        }
        
        if (maxCount === 0 || rgbBins[bestBin].count === 0) throw new Error("No vibrant colors found");
        
        const avgR = Math.floor(rgbBins[bestBin].r / rgbBins[bestBin].count);
        const avgG = Math.floor(rgbBins[bestBin].g / rgbBins[bestBin].count);
        const avgB = Math.floor(rgbBins[bestBin].b / rgbBins[bestBin].count);
        
        if (isMounted) {
          setColors(rgbToHslColors(avgR, avgG, avgB));
        }
      } catch (e) {
        // Fallback -> algorithmic hashing if network fails or mock generic image
        // console.warn('JS Image Extraction failed, generating beautiful hash', e);
        const stringToHash = (imageUrl.includes('unsplash') && fallbackHash) ? fallbackHash : imageUrl;
        let hash = 0;
        for (let i = 0; i < stringToHash.length; i++) {
            hash = stringToHash.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash) % 360;
        
        if (isMounted) {
          setColors({
            background: `hsl(${hue}, 40%, 10%)`,
            primary: `hsl(${hue}, 80%, 65%)`,
            secondary: `hsl(${hue}, 30%, 45%)`,
            detail: `hsl(${hue}, 90%, 80%)`,
          });
        }
      }
    };

    fetchTrueColors();

    return () => {
      isMounted = false;
    };
  }, [imageUrl, fallbackHash]);

  return colors;
}
