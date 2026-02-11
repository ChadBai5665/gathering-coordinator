import { useState, useEffect } from 'react';

interface LocationState {
  lat: number;
  lng: number;
  name?: string;
}

export function useLocation(autoRequest = false) {
  const [location, setLocation] = useState<LocationState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError('浏览器不支持定位');
      return;
    }

    setLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        const messages: Record<number, string> = {
          1: '定位权限被拒绝，请在浏览器设置中允许',
          2: '无法获取位置信息',
          3: '定位超时',
        };
        setError(messages[err.code] || '定位失败');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  };

  useEffect(() => {
    if (autoRequest) {
      requestLocation();
    }
  }, [autoRequest]);

  return { location, loading, error, requestLocation };
}
