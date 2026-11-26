import { useEffect, useRef } from "react";
import Hls from "hls.js";

interface VideoPlayerProps {
  src: string;
}

export function VideoPlayer({ src }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Safari / iOS — нативный HLS
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      return;
    }

    if (!Hls.isSupported()) {
      console.warn("HLS не поддерживается этим браузером");
      return;
    }

    const hls = new Hls({
      liveDurationInfinity: true,
      lowLatencyMode: true,
      backBufferLength: 30,
    });

    hls.loadSource(src);
    hls.attachMedia(video);

    hls.on(Hls.Events.ERROR, (_evt, data) => {
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            hls.recoverMediaError();
            break;
          default:
            hls.destroy();
        }
      }
    });

    return () => {
      hls.destroy();
    };
  }, [src]);

  return (
    <div className="video">
      <video ref={videoRef} controls autoPlay muted playsInline />
      <div className="video-badge">LIVE</div>
    </div>
  );
}