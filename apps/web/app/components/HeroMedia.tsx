import React from 'react';
import { urlFor } from '~/lib/sanity';

export default function HeroMedia({ siteConfig, neverShowVideo }: { siteConfig: any, neverShowVideo?: boolean }) {
  const videoUrl = siteConfig?.heroBackgroundVideo?.asset?.url;

  const image = siteConfig?.heroBackgroundImage;

  if (videoUrl && !neverShowVideo) {
    return (
      <>
        <video
          className="absolute inset-0 w-full h-full object-cover object-center"
          src={videoUrl}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-primary-900/30 to-black/60 z-10" />
      </>
    );
  }

  if (image) {
    return (
      <>
        <img
          src={urlFor(image).width(1920).height(1080).url()}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-primary-900/50 to-black/70 z-10" />
      </>
    );
  }

  return <div className="absolute inset-0 bg-gradient-to-br from-primary-950 via-primary-800 to-primary-600" />;
}
