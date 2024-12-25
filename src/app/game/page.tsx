"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import PixelCharacter from "@/components/PixelCharacter";
import { useRouter } from "next/navigation";

interface Couple {
  id: number;
  yPosition: number; // 위아래 위치 (이전의 x)
  lane: number; // 좌우 레인 (0: 왼쪽, 1: 가운데, 2: 오른쪽)
}

export default function GamePage() {
  const router = useRouter();
  const [angerLevel, setAngerLevel] = useState(0);
  const [playerLane, setPlayerLane] = useState(1); // 0: 왼쪽, 1: 가운데, 2: 오른쪽
  const [couples, setCouples] = useState<Couple[]>([]);
  const [gameStatus, setGameStatus] = useState<"playing" | "over" | "clear">(
    "playing"
  );
  const [score, setScore] = useState(0);

  // 충돌 감지 함수
  const checkCollisionWithCouple = (
    coupleLane: number,
    coupleYPosition: number
  ) => {
    if (gameStatus !== "playing") return false;

    const isColliding =
      coupleLane === playerLane &&
      coupleYPosition >= 75 &&
      coupleYPosition <= 85;

    if (isColliding) {
      console.log("충돌 발생!", {
        플레이어: { 레인: playerLane, Y위치: 80 },
        커플: { 레인: coupleLane, Y위치: coupleYPosition },
      });
      setAngerLevel((prev) => Math.min(100, prev + 15));
    }
    return isColliding;
  };

  // 게임 상태 체크
  useEffect(() => {
    if (angerLevel >= 100) {
      setGameStatus("over");
    }
  }, [angerLevel]);

  // 커플 생성
  useEffect(() => {
    if (gameStatus !== "playing") return;

    const spawnCouple = () => {
      setCouples((prev) => {
        if (prev.length === 0) {
          const newCouple: Couple = {
            id: Date.now(),
            yPosition: 0,
            lane: Math.floor(Math.random() * 3),
          };
          return [newCouple];
        }
        return prev;
      });
    };

    const spawnInterval = setInterval(spawnCouple, 2000);
    return () => clearInterval(spawnInterval);
  }, [gameStatus]);

  // 커플 이동 및 제거
  useEffect(() => {
    if (gameStatus !== "playing") return;

    const moveInterval = setInterval(() => {
      setCouples((prevCouples) => {
        return prevCouples
          .map((couple) => {
            const newY = couple.yPosition + 1;
            checkCollisionWithCouple(couple.lane, newY);
            return {
              ...couple,
              yPosition: newY,
            };
          })
          .filter((couple) => couple.yPosition <= 100);
      });
      setScore((prev) => prev + 1);
    }, 50);

    return () => clearInterval(moveInterval);
  }, [gameStatus, playerLane]);

  // 플레이어 이동 (키보드)
  useEffect(() => {
    if (gameStatus !== "playing") return;

    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          setPlayerLane((prev) => {
            const newLane = Math.max(0, prev - 1);
            couples.forEach((couple) => {
              checkCollisionWithCouple(newLane, couple.yPosition);
            });
            return newLane;
          });
          break;
        case "ArrowRight":
          setPlayerLane((prev) => {
            const newLane = Math.min(2, prev + 1);
            couples.forEach((couple) => {
              checkCollisionWithCouple(newLane, couple.yPosition);
            });
            return newLane;
          });
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [gameStatus, couples]);

  // 모바일 컨트롤 핸들러
  const handleTouchControl = (direction: "left" | "right") => {
    if (direction === "left") {
      setPlayerLane((prev) => {
        const newLane = Math.max(0, prev - 1);
        couples.forEach((couple) => {
          checkCollisionWithCouple(newLane, couple.yPosition);
        });
        return newLane;
      });
    } else {
      setPlayerLane((prev) => {
        const newLane = Math.min(2, prev + 1);
        couples.forEach((couple) => {
          checkCollisionWithCouple(newLane, couple.yPosition);
        });
        return newLane;
      });
    }
  };

  const getLanePosition = (lane: number): number => {
    switch (lane) {
      case 0:
        return 25;
      case 1:
        return 50;
      case 2:
        return 75;
      default:
        return 50;
    }
  };

  return (
    <div className='fixed inset-0 bg-gray-900 overflow-hidden'>
      {/* 분노 게이지 */}
      <div className='absolute top-4 left-4 right-4 h-4 bg-gray-700 rounded-full overflow-hidden z-20'>
        <motion.div
          className='h-full bg-red-600'
          style={{ width: `${angerLevel}%` }}
          animate={{ width: `${angerLevel}%` }}
        />
      </div>

      {/* 점수 */}
      <div className='absolute top-12 left-4 text-white z-20'>
        점수: {Math.floor(score / 20)}
      </div>

      {/* 게임 영역 */}
      <div className='relative w-full h-full'>
        {/* 움직이는 배경 */}
        <div className='absolute inset-0 overflow-hidden'>
          {/* 건물 배경 */}
          <div
            className='absolute inset-0 bg-repeat-x animate-slide'
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='200' viewBox='0 0 100 200' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='10' y='50' width='30' height='150' fill='%23334155'/%3E%3Crect x='60' y='80' width='30' height='120' fill='%23334155'/%3E%3C/svg%3E")`,
              backgroundSize: "100px 200px",
            }}
          />
          {/* 가로등 */}
          <div
            className='absolute inset-0 bg-repeat-x animate-slide-slow'
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='95' y='50' width='10' height='150' fill='%23475569'/%3E%3Ccircle cx='100' cy='45' r='15' fill='%23FDE047' fill-opacity='0.3'/%3E%3C/svg%3E")`,
              backgroundSize: "200px 200px",
            }}
          />
        </div>

        {/* 레인 구분선 */}
        <div className='absolute inset-0 flex justify-between px-[20%] opacity-30'>
          <div className='w-px h-full bg-white' />
          <div className='w-px h-full bg-white' />
        </div>

        {/* 플레이어 릭터 */}
        <PixelCharacter
          x={getLanePosition(playerLane)}
          y={80}
          isPlayer={true}
        />

        {/* 커플 NPC들 */}
        {couples.map((couple) => (
          <PixelCharacter
            key={couple.id}
            x={getLanePosition(couple.lane)}
            y={couple.yPosition}
            isCouple={true}
          />
        ))}

        {/* 모바일 컨트롤 */}
        <div className='absolute bottom-0 inset-x-0 h-32 flex justify-between p-4 z-20'>
          <button
            className='w-1/3 h-full bg-white/10 rounded-lg active:bg-white/20'
            onClick={() => handleTouchControl("left")}
          >
            왼쪽
          </button>
          <button
            className='w-1/3 h-full bg-white/10 rounded-lg active:bg-white/20'
            onClick={() => handleTouchControl("right")}
          >
            오른쪽
          </button>
        </div>

        {/* 게임 오버 화면 */}
        {gameStatus !== "playing" && (
          <div className='absolute inset-0 bg-black/80 flex items-center justify-center z-30'>
            <div className='text-center'>
              <h2 className='text-4xl font-bold mb-4 text-red-500'>
                게임 오버...
              </h2>
              <p className='text-white mb-4'>분노를 지 못했습니다...</p>
              <p className='text-white mb-8'>
                최종 점수: {Math.floor(score / 20)}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className='px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors'
                onClick={() => router.push("/")}
              >
                다시 시작하기
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
