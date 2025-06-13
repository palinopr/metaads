// Chart export utilities - optional html2canvas integration
// This file handles dynamic importing of html2canvas to avoid build issues

export interface ExportOptions {
  format: 'png' | 'jpg' | 'svg';
  filename: string;
  quality?: number;
}

/**
 * Safely export chart as image using html2canvas (if available)
 * Falls back to SVG export if html2canvas is not available
 */
export async function exportChart(
  element: HTMLElement,
  options: ExportOptions
): Promise<boolean> {
  const { format, filename, quality = 1.0 } = options;

  if (format === 'svg') {
    return exportAsSVG(element, filename);
  }

  // Try to use html2canvas for raster formats
  try {
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      throw new Error('Not in browser environment');
    }

    // Try to load html2canvas from CDN or existing installation
    let html2canvas: any;
    
    // First try to import from node_modules if available
    try {
      const module = await eval('import("html2canvas")');
      html2canvas = module.default;
    } catch {
      // If import fails, try to load from CDN
      html2canvas = await loadHtml2CanvasFromCDN();
    }
    
    if (!html2canvas) {
      throw new Error('html2canvas not available');
    }
    
    const canvas = await html2canvas(element, {
      backgroundColor: null,
      scale: 2, // Higher resolution
      useCORS: true,
      allowTaint: true,
    });
    
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const dataUrl = canvas.toDataURL(mimeType, quality);
    
    downloadFile(dataUrl, `${filename}.${format}`);
    return true;
  } catch (error) {
    console.warn('html2canvas not available, falling back to SVG:', error);
    return exportAsSVG(element, filename);
  }
}

/**
 * Export chart as SVG (no dependencies required)
 */
function exportAsSVG(element: HTMLElement, filename: string): boolean {
  try {
    const svgElement = element.querySelector('svg');
    if (!svgElement) {
      console.error('No SVG element found in chart');
      return false;
    }

    // Clone the SVG to avoid modifying the original
    const svgClone = svgElement.cloneNode(true) as SVGElement;
    
    // Ensure proper SVG namespace and styling
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgClone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    
    // Get computed styles and apply them inline
    const computedStyles = window.getComputedStyle(svgElement);
    svgClone.style.backgroundColor = computedStyles.backgroundColor || 'white';
    
    const svgData = new XMLSerializer().serializeToString(svgClone);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    downloadFile(url, `${filename}.svg`);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Failed to export as SVG:', error);
    return false;
  }
}

/**
 * Download a file using a data URL or blob URL
 */
function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Load html2canvas from CDN as fallback
 */
async function loadHtml2CanvasFromCDN(): Promise<any> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if ((window as any).html2canvas) {
      resolve((window as any).html2canvas);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
    script.onload = () => {
      resolve((window as any).html2canvas);
    };
    script.onerror = () => {
      reject(new Error('Failed to load html2canvas from CDN'));
    };
    document.head.appendChild(script);
  });
}

/**
 * Check if html2canvas is available
 */
export async function isHtml2CanvasAvailable(): Promise<boolean> {
  try {
    if (typeof window === 'undefined') return false;
    
    // Try eval import to avoid build-time resolution
    try {
      await eval('import("html2canvas")');
      return true;
    } catch {
      // Try CDN loading
      try {
        await loadHtml2CanvasFromCDN();
        return true;
      } catch {
        return false;
      }
    }
  } catch {
    return false;
  }
}