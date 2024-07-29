"use client"

import React, { useState, useRef, useEffect, FormEventHandler } from 'react';
import Link from 'next/link';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { DownloadIcon, Share2Icon, ShuffleIcon, TwitterLogoIcon } from '@radix-ui/react-icons';

const Main = () => {
  const frameCount = 3;
  
  const [word, setWord] = useState('BABA');
  const [font, setFont] = useState('Arial');
  const [bgColor, setBgColor] = useState('#000000');
  const [textColor, setTextColor] = useState('#BA2260');
  const [canvasSize, setCanvasSize] = useState(100);
  const [fontSize, setFontSize] = useState(50);
  const [padding, setPadding] = useState(6);
  const [updateTrigger, setUpdateTrigger] = useState(false);
  const [gifUrl, setGifUrl] = useState("");

  const { toast } = useToast();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const animationRef = useRef<NodeJS.Timeout>(null);
  const [frames, setFrames] = useState<ImageData[]>([]);

  const pixelSize = 4; // 픽셀화 크기
  const frameDelay = 200; // 300ms

  const createFrame = (ctx: CanvasRenderingContext2D, text: string, width: number, height: number, padding: number): ImageData => {
    const originalWidth = width - padding * 2
    const originalHeight = height - padding * 2
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);

    ctx.font = `bold ${fontSize}px ${font}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    const chars = text.split('');
    const isDoubleRow = chars.length >= 3;
    const cols = (chars.length + 1) / 2 | 0
    const rows = isDoubleRow ? [chars.slice(0, cols), chars.slice(cols)] : [chars];
    const gridSize = isDoubleRow ? cols : Math.ceil(Math.sqrt(chars.length));
    const cellWidth = originalWidth / gridSize;
    const cellHeight = isDoubleRow ? originalHeight / 2 : cellWidth;

    rows.forEach((row, rowIndex) => {
      row.forEach((char, colIndex) => {
        const x = padding + (colIndex + 0.5) * cellWidth;
        const y = isDoubleRow 
          ? padding + (rowIndex + 0.5) * cellHeight
          : padding + (Math.floor(colIndex / gridSize) + 0.5) * cellHeight;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((Math.random() - 0.5) * 0.2);
        ctx.transform(1, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2, 1, 0, 0);
        ctx.fillStyle = "#fff";
        ctx.fillText(char.toUpperCase(), 0, 0);
        ctx.restore();
      });
    });

    // 픽셀화 with threshold
    const imageData = ctx.getImageData(0, 0, width, height);
    for (let y = 0; y < height; y += pixelSize) {
      for (let x = 0; x < width; x += pixelSize) {
        const i = (y * width + x) * 4;
        const avg = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
        const color = avg > 127 ? textColor : bgColor;
        const [r, g, b] = hexToRgb(color);
        for (let py = 0; py < pixelSize; py++) {
          for (let px = 0; px < pixelSize; px++) {
            const pi = ((y + py) * width + (x + px)) * 4;
            imageData.data[pi] = r;
            imageData.data[pi + 1] = g;
            imageData.data[pi + 2] = b;
          }
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return imageData;
  };

  const hexToRgb = (hex: string) => {
    const bigint = parseInt(hex.slice(1), 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
  };

  const animate = () => {
    let index = 0;

    const drawFrame = () => {
      index = (index + 1) % frameCount;
      setCurrentFrame(index);
      animationRef.current = setTimeout(drawFrame, frameDelay);
    };

    drawFrame();
  };

  const createFrames = (text: string) => {
    const canvas = canvasRef.current;
    if (canvas == null) return
    const { width, height } = canvas;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx == null) return

    const frames = [...Array(frameCount)].map(_ => 
      createFrame(ctx, text, width, height, padding)
    );

    setFrames(frames);
    const gif = GIFEncoder();
    frames.forEach((frame) => {
      const data = frame.data;
      const palette = quantize(data, 256);
      const index = applyPalette(data, palette);
      gif.writeFrame(index, width, height, { 
        palette,
        delay: frameDelay
      });
    });
    gif.finish();
    const blob = new Blob([gif.bytes()]);
    setGifUrl(URL.createObjectURL(blob));
  }

  useEffect(() => {
    createFrames(word);
    animate();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas == null) return
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx == null) return
    if (frames.length != frameCount) return
    let frame = frames[currentFrame];
    ctx.putImageData(frame, 0, 0);
  }, [currentFrame]);

  useEffect(() => {
    createFrames(word);
  }, [word, font, bgColor, textColor, canvasSize, fontSize, padding, updateTrigger]);

  return (
    <>
      <div className="flex h-screen">
        <div className="w-[350px] m-auto">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">baba icon 생성기</CardTitle>
              <CardDescription>
                baba-is-you 스타일의 gif 이미지를 생성해줍니다.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="grid gap-4">
              <div>
                <Label>
                  텍스트
                  <Input
                    type="text"
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    placeholder="6글자 이하 단어 입력"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </Label>
              </div>
              <div>
                <Label>
                  폰트이름
                  <Input 
                    type="text"
                    value={font}
                    onChange={(e) => setFont(e.target.value)}
                    placeholder="폰트이름 입력"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </Label>
              </div>
              <div className="flex space-x-4">
                <Label>
                  배경색
                  <Input 
                    type="color" 
                    value={bgColor} 
                    onChange={(e) => setBgColor(e.target.value)} 
                    className="p-1 border rounded"
                    title="배경색"
                  />
                </Label>
                <Label>
                  글자색
                  <Input 
                    type="color" 
                    value={textColor} 
                    onChange={(e) => setTextColor(e.target.value)} 
                    className="p-1 border rounded"
                    title="글자색"
                  />
                </Label>
              </div>
              <div className="space-y-2">
                <Label className="block">
                  캔버스 크기: {canvasSize}px
                  <Input
                    type="range"
                    min="24"
                    max="256"
                    value={canvasSize}
                    onChange={(e) => setCanvasSize(Number(e.target.value))}
                    className="w-full"
                  />
                </Label>
                <Label className="block">
                  글자 크기: {fontSize}px
                  <Input
                    type="range"
                    min="4"
                    max="100"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full"
                  />
                </Label>
                <Label className="block">
                  패딩: {padding}px
                  <Input
                    type="range"
                    min="0"
                    max="30"
                    value={padding}
                    onChange={(e) => setPadding(Number(e.target.value))}
                    className="w-full"
                  />
                </Label>
              </div>
              <Button className="w-full" onClick={ _ => setUpdateTrigger(!updateTrigger) }>
                <ShuffleIcon className="mr-2 h-4 w-4" /> 애니메이션 다시 생성
              </Button>
              
              <div className="flex items-center justify-center h-[256px] rounded-md border">
                <canvas
                  ref={canvasRef} 
                  width={canvasSize + padding * 2} 
                  height={canvasSize + padding * 2} 
                />
              </div>
              <p className="mt-2">현재 프레임: {currentFrame + 1}</p>
            </CardContent>

            <CardFooter>
              {/* <Link href={gifUrl} download={true}> */}
                <Button
                  className="w-full"
                  onClick={
                    () => {
                      const link = document.createElement("a");
                      link.href = gifUrl;
                      link.download = `${word}.gif`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }
                >
                  <DownloadIcon className="mr-2 h-4 w-4" /> gif 만들기
                </Button>
              {/* </Link> */}
            </CardFooter>
          </Card>

          <div className="flex justify-center items-center text-sm space-x-2 text-muted-foreground h-10">
            <TwitterLogoIcon />
            &nbsp;or 𝕏 :
            <Link href="https://twitter.com/harunene">@harunene</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Main;