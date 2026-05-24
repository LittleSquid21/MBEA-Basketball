import React, { useState, useEffect } from 'react';
import { MOCK_TEAMS } from '../constants';

interface TeamLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  teamId: string;
  logoUrl?: string;
  className?: string;
}

export default function TeamLogo({ teamId, logoUrl, className, ...props }: TeamLogoProps) {
  // Map team IDs/names to user uploaded high-resolution assets in /public
  const getLocalUrl = (id: string) => {
    const cleanId = id.toLowerCase();
    if (cleanId.includes('green') || cleanId.includes('绿袍') || cleanId.includes('骑士')) return '/绿袍.png';
    if (cleanId.includes('black') || cleanId.includes('gate') || cleanId.includes('黑门') || cleanId.includes('hermon')) return '/黑门.png';
    if (cleanId.includes('super') || cleanId.includes('sc') || cleanId.includes('class')) return '/SC.png';
    if (cleanId.includes('ent') || cleanId.includes('树人') || cleanId.includes('慢脚')) return '/树人.png';
    return null;
  };

  const localUrl = getLocalUrl(teamId);
  const primaryUrl = localUrl || logoUrl || 'https://picsum.photos/seed/' + teamId + '/150/150';

  const [src, setSrc] = useState(primaryUrl);

  // Sync src if logoUrl or teamId changes
  useEffect(() => {
    setSrc(localUrl || logoUrl || 'https://picsum.photos/seed/' + teamId + '/150/150');
  }, [teamId, logoUrl, localUrl]);

  const getSvgFallback = () => {
    const mock = MOCK_TEAMS.find(m => m.id === teamId || m.name === teamId);
    return mock?.logoUrl || 'https://picsum.photos/seed/' + teamId + '/150/150';
  };

  const handleError = () => {
    const fallback = getSvgFallback();
    if (src !== fallback) {
      setSrc(fallback);
    }
  };

  return (
    <img
      src={src}
      onError={handleError}
      className={className}
      referrerPolicy="no-referrer"
      alt=""
      {...props}
    />
  );
}
