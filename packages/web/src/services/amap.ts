let mapLoaded = false;
let loadPromise: Promise<void> | null = null;

/**
 * 动态加载高德地图 JS API
 */
export function loadAMap(): Promise<void> {
  if (mapLoaded) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    // 设置安全密钥
    (window as any)._AMapSecurityConfig = {
      securityJsCode: import.meta.env.VITE_AMAP_JS_SECRET || '',
    };

    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${import.meta.env.VITE_AMAP_JS_KEY}`;
    script.onload = () => {
      mapLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('高德地图加载失败'));
    document.head.appendChild(script);
  });

  return loadPromise;
}
