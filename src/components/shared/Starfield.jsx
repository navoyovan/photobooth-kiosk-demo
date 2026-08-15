import React, { useEffect, useRef, useState } from 'react';
import { animate } from 'animejs';
import { getCommunityPhotoUrls } from '../../utils/imageProcessor';

const FloatingPhotos = ({ previousImage, isOutro, isVisible, isTransformed, showPhotos = true, grayscale = false }) => {
  const canvasRef = useRef(null);
  const photosRef = useRef([]);
  const prevImgRef = useRef(null);
  const isOutroRef = useRef(isOutro);
  const showPhotosRef = useRef(showPhotos);
  const globalPhotosOpacity = useRef({ value: showPhotos ? 1 : 0 });

  // FIX 1 + 2: Zero-padded paths + async decode — images only enter the pool after verified ready
  const [loadedImages, setLoadedImages] = useState([]);

  useEffect(() => {
    const localPhotos = Array.from({ length: 30 }, (_, i) =>
      `/starfield/${String(i + 1).padStart(2, '0')}.webp`
    );
    Promise.all(
      localPhotos.map(src => {
        const img = new Image();
        img.src = src;
        return img.decode()
          .then(() => img)
          .catch(() => null); // silently drop 404s or decode errors
      })
    ).then(results => {
      const valid = results.filter(Boolean);
      console.log(`[Starfield] Decoded ${valid.length}/${localPhotos.length} local images.`);
      setLoadedImages(valid);
    });
  }, []);

  const [communityImages, setCommunityImages] = useState([]);

  // load community photos from IndexedDB
  useEffect(() => {
    const loadCommunity = async () => {
      try {
        const urls = await getCommunityPhotoUrls();
        if (urls.length > 0) {
          const imgPromises = urls.map(url => {
            return new Promise((resolve) => {
              const img = new Image();
              img.onload = () => resolve(img);
              img.onerror = () => resolve(null); // ignore broken images
              img.src = url;
            });
          });

          const loadedImgs = (await Promise.all(imgPromises)).filter(Boolean);
          setCommunityImages(loadedImgs);
          console.log(`[Starfield] Strict-loaded ${loadedImgs.length} community photos with aspect ratios.`);
        } else {
          setCommunityImages([]);
        }
      } catch (err) {
        console.warn("[Starfield] Failed to load community photos:", err);
      }
    };
    loadCommunity();
  }, [isVisible]);

  // Sync isOutro to ref
  useEffect(() => {
    isOutroRef.current = isOutro;

    if (showPhotos !== showPhotosRef.current) {
      showPhotosRef.current = showPhotos;

      animate(globalPhotosOpacity.current, {
        value: showPhotos ? 1 : 0,
        duration: 1500,
        easing: 'easeInOutQuad'
      });
    }
  }, [isOutro, showPhotos]);

  // Load previous image
  useEffect(() => {
    if (previousImage) {
      const img = new Image();
      img.src = previousImage;
      prevImgRef.current = img;
    } else {
      prevImgRef.current = null;
    }
  }, [previousImage]);

  const animProps = useRef({ focalLength: 200, speed: 1.2, maxDepth: 1000 });

  useEffect(() => {
    if (isTransformed) {
      animate(animProps.current, {
        focalLength: 600, speed: 2, maxDepth: 1000,
        duration: 1200, easing: 'easeInOutQuad'
      });
    } else {
      animate(animProps.current, {
        focalLength: 200, speed: 1.5, maxDepth: 1000,
        duration: 1300, easing: 'easeInOutQuad'
      });
    }
  }, [isTransformed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    //spawnrate
    const numPhotos = 15;

    const getSpawnPos = () => {
      let px, py;
      do {
        px = (Math.random() - 0.5) * 2000;
        py = (Math.random() - 0.5) * 2000;
      } while (Math.abs(px) < 400 && Math.abs(py) < 400);
      return { x: px, y: py };
    };

    if (photosRef.current.length < numPhotos) {
      const needed = numPhotos - photosRef.current.length;
      for (let i = 0; i < needed; i++) {
        const pos = getSpawnPos();

        const activePlaceholders = loadedImages.slice(0, Math.max(0, loadedImages.length - communityImages.length));
        const pool = [...activePlaceholders, ...communityImages];
        const selectedImg = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null;

        photosRef.current.push({
          x: pos.x, y: pos.y, z: Math.random() * animProps.current.maxDepth,
          baseHeight: (350 + Math.random() * 350),
          rotation: 0, rotationSpeed: 0, imageObject: selectedImg
        });
      }
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      const currentPhotos = photosRef.current;
      currentPhotos.sort((a, b) => b.z - a.z);

      currentPhotos.forEach(photo => {
        photo.z -= animProps.current.speed;

        if (photo.z <= -100) {
          const pos = getSpawnPos();
          photo.x = pos.x;
          photo.y = pos.y;
          photo.z = animProps.current.maxDepth + (Math.random() * 150 - 50);

          if (isOutroRef.current && prevImgRef.current) {
            photo.imageObject = prevImgRef.current;
          } else {
            const activePlaceholders = loadedImages.slice(0, Math.max(0, loadedImages.length - communityImages.length));
            const pool = [...activePlaceholders, ...communityImages];
            photo.imageObject = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null;
          }
          photo.baseHeight = (350 + Math.random() * 350);
        }

        const currentFocalLength = animProps.current.focalLength;
        const perspective = currentFocalLength / (currentFocalLength + photo.z);
        const projectedX = centerX + photo.x * perspective;
        const projectedY = centerY + photo.y * perspective;
        const scale = Math.max(0.01, perspective);

        // --- Adaptive Sizing based on Aspect Ratio (Dynamic Recalibration) ---
        let currentBaseHeight = photo.baseHeight || 400;
        let currentBaseWidth = currentBaseHeight * 0.75; // Default fallback

        if (photo.imageObject && photo.imageObject.complete && photo.imageObject.naturalHeight > 0) {
          // If the image just loaded, this will now correctly calculate the width
          currentBaseWidth = currentBaseHeight * (photo.imageObject.naturalWidth / photo.imageObject.naturalHeight);
        }

        const scaledWidth = currentBaseWidth * scale;
        const scaledHeight = currentBaseHeight * scale;

        let opacity = 1;
        if (photo.z > animProps.current.maxDepth - 500) opacity = (animProps.current.maxDepth - photo.z) / 500;
        if (photo.z < 0) opacity *= Math.max(0, (100 + photo.z) / 100);

        if (
          globalPhotosOpacity.current.value > 0.01 &&
          projectedX + scaledWidth > 0 && projectedX - scaledWidth < canvas.width &&
          projectedY + scaledHeight > 0 && projectedY - scaledHeight < canvas.height
        ) {
          // FIX 3: Only draw if image is fully ready — no gray fillRect fallback
          if (photo.imageObject && photo.imageObject.complete && photo.imageObject.naturalHeight > 0) {
            ctx.save();
            ctx.translate(projectedX, projectedY);
            ctx.globalAlpha = Math.max(0, opacity * globalPhotosOpacity.current.value);
            ctx.drawImage(photo.imageObject, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
            ctx.restore();
          }
          // If not ready: skip silently — the 60fps loop will draw it next tick
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isVisible, loadedImages, communityImages]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        zIndex: 0, pointerEvents: 'none',
        background: isOutro ? '#000' : 'transparent',
        transition: 'background 2s ease-in-out, opacity 0.5s ease-out, filter 1s ease',
        opacity: isVisible ? 1 : 0,
        filter: grayscale ? 'grayscale(90%) contrast(0.9) brightness(0.85)' : undefined,
      }}
    />
  );
};

export default FloatingPhotos;