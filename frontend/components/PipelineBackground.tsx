import React, { useEffect, useRef } from 'react';

export const PipelineBackground: React.FC = () => {
  const canvasARef = useRef<HTMLCanvasElement>(null);
  const canvasBRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvasA = canvasARef.current;
    const canvasB = canvasBRef.current;
    if (!canvasA || !canvasB) return;

    const ctxA = canvasA.getContext('2d');
    const ctxB = canvasB.getContext('2d');
    if (!ctxA || !ctxB) return;

    // Configuración
    const pipeCount = 30;
    const pipePropCount = 8;
    const pipePropsLength = pipeCount * pipePropCount;
    const turnChanceRange = 58;
    const baseSpeed = 0.5;
    const rangeSpeed = 1;
    const baseTTL = 100;
    const rangeTTL = 300;
    const baseWidth = 2;
    const rangeWidth = 4;
    const baseHue = 180;
    const rangeHue = 60;
    const backgroundColor = 'hsla(150,80%,1%,1)';
    const TAU = 2 * Math.PI;
    const HALF_PI = Math.PI / 2;
    const turnCount = 8;
    const turnAmount = (360 / turnCount) * (Math.PI / 180);

    let tick = 0;
    let center: number[] = [];
    let pipeProps: Float32Array;

    const rand = (n: number) => Math.random() * n;
    const round = (n: number) => Math.round(n);
    const fadeInOut = (life: number, ttl: number) => {
      const halfTTL = ttl / 2;
      return life < halfTTL ? life / halfTTL : (ttl - life) / halfTTL;
    };

    const resize = () => {
      const { innerWidth, innerHeight } = window;
      
      canvasA.width = innerWidth;
      canvasA.height = innerHeight;
      canvasB.width = innerWidth;
      canvasB.height = innerHeight;
      
      center = [innerWidth / 2, innerHeight / 2];
    };

    const initPipe = (i: number) => {
      const x = rand(canvasA.width);
      const y = center[1];
      const direction = round(rand(1)) ? HALF_PI : TAU - HALF_PI;
      const speed = baseSpeed + rand(rangeSpeed);
      const life = 0;
      const ttl = baseTTL + rand(rangeTTL);
      const width = baseWidth + rand(rangeWidth);
      const hue = baseHue + rand(rangeHue);
      
      pipeProps.set([x, y, direction, speed, life, ttl, width, hue], i);
    };

    const initPipes = () => {
      pipeProps = new Float32Array(pipePropsLength);
      for (let i = 0; i < pipePropsLength; i += pipePropCount) {
        initPipe(i);
      }
    };

    const drawPipe = (x: number, y: number, life: number, ttl: number, width: number, hue: number) => {
      ctxA.save();
      ctxA.strokeStyle = `hsla(${hue},75%,50%,${fadeInOut(life, ttl) * 0.125})`;
      ctxA.beginPath();
      ctxA.arc(x, y, width, 0, TAU);
      ctxA.stroke();
      ctxA.closePath();
      ctxA.restore();
    };

    const updatePipe = (i: number) => {
      let x = pipeProps[i];
      let y = pipeProps[i + 1];
      let direction = pipeProps[i + 2];
      const speed = pipeProps[i + 3];
      let life = pipeProps[i + 4];
      const ttl = pipeProps[i + 5];
      const width = pipeProps[i + 6];
      const hue = pipeProps[i + 7];

      drawPipe(x, y, life, ttl, width, hue);

      life++;
      x += Math.cos(direction) * speed;
      y += Math.sin(direction) * speed;

      const turnChance = !(tick % round(rand(turnChanceRange))) && 
                        (!(round(x) % 6) || !(round(y) % 6));
      const turnBias = round(rand(1)) ? -1 : 1;
      direction += turnChance ? turnAmount * turnBias : 0;

      if (x > canvasA.width) x = 0;
      if (x < 0) x = canvasA.width;
      if (y > canvasA.height) y = 0;
      if (y < 0) y = canvasA.height;

      pipeProps[i] = x;
      pipeProps[i + 1] = y;
      pipeProps[i + 2] = direction;
      pipeProps[i + 4] = life;

      if (life > ttl) initPipe(i);
    };

    const updatePipes = () => {
      tick++;
      for (let i = 0; i < pipePropsLength; i += pipePropCount) {
        updatePipe(i);
      }
    };

    const render = () => {
      ctxB.save();
      ctxB.fillStyle = backgroundColor;
      ctxB.fillRect(0, 0, canvasB.width, canvasB.height);
      ctxB.restore();

      ctxB.save();
      ctxB.filter = 'blur(12px)';
      ctxB.drawImage(canvasA, 0, 0);
      ctxB.restore();

      ctxB.save();
      ctxB.drawImage(canvasA, 0, 0);
      ctxB.restore();
    };

    const draw = () => {
      updatePipes();
      render();
      animationRef.current = requestAnimationFrame(draw);
    };

    resize();
    initPipes();
    draw();

    const handleResize = () => resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <>
      <canvas ref={canvasARef} style={{ display: 'none' }} />
      <canvas
        ref={canvasBRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0
        }}
      />
    </>
  );
};