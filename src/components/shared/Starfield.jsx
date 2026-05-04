import React, { useEffect, useRef, useMemo } from 'react';
import { animate, cubicBezier } from 'animejs';

const FloatingPhotos = ({ previousImage, isOutro, isVisible, isTransformed, showPhotos = true }) => {
  const canvasRef = useRef(null);
  const photosRef = useRef([]);
  const prevImgRef = useRef(null);
  const isOutroRef = useRef(isOutro);
  const showPhotosRef = useRef(showPhotos);
  const globalPhotosOpacity = useRef({ value: showPhotos ? 1 : 0 });


  // Pre-load all collage images
  const loadedImages = useMemo(() => {
    const localPhotos = [
      '/starfield/1.webp', '/starfield/2.webp', '/starfield/3.webp', '/starfield/4.webp', '/starfield/5.webp',
      '/starfield/6.webp', '/starfield/7.webp', '/starfield/8.webp', '/starfield/9.webp', '/starfield/10.webp',
      '/starfield/11.webp', '/starfield/12.webp', '/starfield/13.webp', '/starfield/14.webp', '/starfield/15.webp',
      '/starfield/16.webp', '/starfield/17.webp', '/starfield/18.webp', '/starfield/19.webp', '/starfield/20.webp',
      '/starfield/21.webp', '/starfield/22.webp', '/starfield/23.webp', '/starfield/24.webp', '/starfield/25.webp',
      '/starfield/26.webp', '/starfield/27.webp', '/starfield/28.webp', '/starfield/29.webp', '/starfield/30.webp',
    ];
    return localPhotos.map(src => {
      const img = new Image();
      img.src = src;
      return img;
    });
  }, []);

  // Sync isOutro to ref for animation loop access without re-running useEffect
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

  // Load previous image when it changes
  useEffect(() => {
    if (previousImage) {
      const img = new Image();
      img.src = previousImage;
      prevImgRef.current = img;
    } else {
      prevImgRef.current = null;
    }
  }, [previousImage]);

  // Animation parameters for state transitions
  const animProps = useRef({ focalLength: 200, speed: 1.2, maxDepth: 1000 });

  useEffect(() => {
    if (isTransformed) {
      // Transform to "Payment/Outro" mode (closer, FASTER, shallower)
      animate(animProps.current, {
        focalLength: 600,
        speed: 3.5,
        maxDepth: 1000,
        duration: 1200,
        easing: 'easeInOutQuad'
      });
    } else {
      // Transform back to "Idle" mode (original values)
      animate(animProps.current, {
        focalLength: 200,
        speed: 1.2,
        maxDepth: 1000,
        duration: 1300,
        easing: 'easeInOutQuad'
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

    const numPhotos = 15;

    const getSpawnPos = () => {
      let px, py;
      do {
        px = (Math.random() - 0.5) * 2000;
        py = (Math.random() - 0.5) * 2000;
      } while (Math.abs(px) < 400 && Math.abs(py) < 400);
      return { x: px, y: py };
    };

    // Initialize photos if they don't exist or add more if needed
    if (photosRef.current.length < numPhotos) {
      const needed = numPhotos - photosRef.current.length;
      for (let i = 0; i < needed; i++) {
        const pos = getSpawnPos();
        photosRef.current.push({
          x: pos.x,
          y: pos.y,
          z: Math.random() * animProps.current.maxDepth,
          baseHeight: (350 + Math.random() * 350), // Expanded scale range for more variety
          rotation: 0, // Rotation disabled
          rotationSpeed: 0,
          imageObject: loadedImages[Math.floor(Math.random() * loadedImages.length)]
        });
      }
    }

    const render = () => {
      if (!isVisible) {
        // Even if hidden, we keep the animation loop running or just return?
        // Let's keep it running so it's ready when visible
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      const currentPhotos = photosRef.current;
      currentPhotos.sort((a, b) => b.z - a.z);

      currentPhotos.forEach(photo => {
        photo.z -= animProps.current.speed;
        // photo.rotation += photo.rotationSpeed; // Rotation removed

        if (photo.z <= -100) {
          const pos = getSpawnPos();
          photo.x = pos.x;
          photo.y = pos.y;
          // Randomize reset z slightly to prevent "burst" alignment
          photo.z = animProps.current.maxDepth + (Math.random() * 150 - 50);

          // Decide image for this photo
          if (isOutroRef.current && prevImgRef.current) {
            photo.imageObject = prevImgRef.current;
          } else {
            photo.imageObject = loadedImages[Math.floor(Math.random() * loadedImages.length)];
          }
          photo.baseHeight = (350 + Math.random() * 350); // Re-randomize scale on respawn
        }

        // --- Transitioning Images ---
        // If we just entered Outro, we want to force all photos to the previousImage quickly
        if (isOutroRef.current && prevImgRef.current && photo.imageObject !== prevImgRef.current) {
          // Instead of waiting for respawn, we can switch them when they are somewhat far
          if (photo.z > 200) {
            photo.imageObject = prevImgRef.current;
          }
        }
        // If we just exited Outro, we want them to stay previousImage until they respawn (already handled by respawn logic)


        const currentFocalLength = animProps.current.focalLength;
        const perspective = currentFocalLength / (currentFocalLength + photo.z);
        const projectedX = centerX + photo.x * perspective;
        const projectedY = centerY + photo.y * perspective;

        const scale = Math.max(0.01, perspective);

        // --- Adaptive Sizing based on Aspect Ratio ---
        let currentBaseHeight = photo.baseHeight || 400;
        let currentBaseWidth = currentBaseHeight * 0.75; // Default 3:4 ratio

        if (photo.imageObject && photo.imageObject.complete && photo.imageObject.naturalHeight !== 0) {
          currentBaseWidth = currentBaseHeight * (photo.imageObject.naturalWidth / photo.imageObject.naturalHeight);
        }

        const scaledWidth = currentBaseWidth * scale;
        const scaledHeight = currentBaseHeight * scale;

        let opacity = 1;
        const currentMaxDepth = animProps.current.maxDepth;
        if (photo.z > currentMaxDepth - 500) opacity = (currentMaxDepth - photo.z) / 500;
        if (photo.z < 0) opacity *= Math.max(0, (100 + photo.z) / 100);

        if (
          globalPhotosOpacity.current.value > 0.01 &&
          projectedX + scaledWidth > 0 && projectedX - scaledWidth < canvas.width &&
          projectedY + scaledHeight > 0 && projectedY - scaledHeight < canvas.height
        ) {

          ctx.save();
          ctx.translate(projectedX, projectedY);
          // ctx.rotate(photo.rotation); // Rotation removed
          ctx.globalAlpha = Math.max(0, opacity * globalPhotosOpacity.current.value);

          // 1. Render Gambar Asli (Raw / No Border)
          if (photo.imageObject && photo.imageObject.complete && photo.imageObject.naturalHeight !== 0) {
            ctx.drawImage(photo.imageObject, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
          } else {
            ctx.fillStyle = '#d1cec7';
            ctx.fillRect(-scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
          }

          ctx.restore();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isVisible, loadedImages]); // Only re-run if visibility or base images change

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        background: isOutro ? '#000' : 'transparent',

        transition: 'background 2s ease-in-out, opacity 0.5s ease-out',
        opacity: isVisible ? 1 : 0,
      }}
    />
  );
};

export default FloatingPhotos;