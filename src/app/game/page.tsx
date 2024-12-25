"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useCallback, useMemo } from "react";
import PixelCharacter from "@/components/PixelCharacter";
import { useRouter } from "next/navigation";

interface Couple {
  id: number;
  yPosition: number;
  lane: number;
}

interface StageInfo {
  id: number;
  targetCouples: number;
  title: string;
  message: string;
  background: string;
  spawnInterval: number;
  maxCouplesAtOnce: number;
  moveSpeed: number;
}

const STAGES: StageInfo[] = [
  {
    id: 1,
    targetCouples: 10,
    title: "초저녁",
    message: "아... 오늘도 야근이라 늦었네. 빨리 가야지",
    background: "#4B5563", // 노을진 하늘
    spawnInterval: 1000,
    maxCouplesAtOnce: 1,
    moveSpeed: 1.5, // 기본 속도의 130%
  },
  {
    id: 2,
    targetCouples: 20,
    title: "저녁",
    message: "헉... 점점 커플이 많아지는데?",
    background: "#1F2937", // 어두워진 하늘
    spawnInterval: 800,
    maxCouplesAtOnce: 2,
    moveSpeed: 1.7,
  },
  {
    id: 3,
    targetCouples: 30,
    title: "밤",
    message: "이제 진짜 마지막이다... 조금만 더!",
    background: "#111827", // 깊어진 밤
    spawnInterval: 500,
    maxCouplesAtOnce: 3,
    moveSpeed: 1.9,
  },
];

// 계단식 패턴 생성을 위한 함수 추가
const generateStaircasePattern = (numCouples: number): number[] => {
  if (numCouples === 1) return [Math.floor(Math.random() * 3)];
  if (numCouples === 2) {
    const firstLane = Math.floor(Math.random() * 3);
    let secondLane;
    do {
      secondLane = Math.floor(Math.random() * 3);
    } while (secondLane === firstLane);
    return [firstLane, secondLane];
  }
  // 3명일 때는 계단식 패턴 생성
  const patterns = [
    [0, 1, 2],
    [2, 1, 0],
  ];
  return patterns[Math.floor(Math.random() * patterns.length)];
};

export default function GamePage() {
  const router = useRouter();
  const [angerLevel, setAngerLevel] = useState(0);
  const [playerLane, setPlayerLane] = useState(1);
  const [couples, setCouples] = useState<Couple[]>([]);
  const [gameStatus, setGameStatus] = useState<"playing" | "over" | "clear">(
    "playing"
  );
  const [score, setScore] = useState(0);
  const [lastFrameTime, setLastFrameTime] = useState(0);
  const [currentStage, setCurrentStage] = useState<StageInfo>(STAGES[0]);
  const [avoidedCouples, setAvoidedCouples] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [showStageMessage, setShowStageMessage] = useState(false);
  const [characterMessage, setCharacterMessage] = useState("");

  // 충돌 감지 함수 최적화
  const checkCollisionWithCouple = useCallback(
    (coupleLane: number, coupleYPosition: number) => {
      if (gameStatus !== "playing") return false;

      const isColliding =
        coupleLane === playerLane &&
        coupleYPosition >= 75 &&
        coupleYPosition <= 85;

      if (isColliding) {
        setAngerLevel((prev) => Math.min(100, prev + 5));
      }
      return isColliding;
    },
    [gameStatus, playerLane]
  );

  // 레인 위치 계산 메이제��션
  const getLanePosition = useMemo(
    () =>
      (lane: number): number => {
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
      },
    []
  );

  // 게임 루프 최적화
  useEffect(() => {
    if (gameStatus !== "playing") return;

    let animationFrameId: number;
    const FPS = 60;
    const frameInterval = 1000 / FPS;

    const gameLoop = (timestamp: number) => {
      if (!lastFrameTime || timestamp - lastFrameTime >= frameInterval) {
        setCouples((prevCouples) => {
          const updatedCouples = prevCouples
            .map((couple) => {
              const newY = couple.yPosition + 1 * currentStage.moveSpeed;
              checkCollisionWithCouple(couple.lane, newY);
              return {
                ...couple,
                yPosition: newY,
              };
            })
            .filter((couple) => couple.yPosition <= 100);

          // 커플이 화면을 벗어났을 때 카운트 증가
          if (prevCouples.length > updatedCouples.length) {
            setAvoidedCouples((prev) => {
              const newCount =
                prev + (prevCouples.length - updatedCouples.length);
              // 스테이지 ���리어 크
              if (newCount >= currentStage.targetCouples) {
                const nextStageIndex =
                  STAGES.findIndex((s) => s.id === currentStage.id) + 1;
                if (nextStageIndex < STAGES.length) {
                  setCurrentStage(STAGES[nextStageIndex]);
                  return 0; // 새 스테이지 시작시 카운트 리셋
                } else {
                  setGameStatus("clear");
                }
              }
              return newCount;
            });
          }

          return updatedCouples;
        });

        setScore((prev) => prev + 1);
        setLastFrameTime(timestamp);
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameStatus, checkCollisionWithCouple, lastFrameTime, currentStage]);

  // 커플 생성 로직 최적화 (스테이지별 난이도 적용)
  useEffect(() => {
    if (gameStatus !== "playing" || showIntro || showStageMessage) return;

    const spawnCouple = () => {
      setCouples((prev) => {
        if (prev.length < currentStage.maxCouplesAtOnce) {
          const numNewCouples = currentStage.maxCouplesAtOnce - prev.length;
          const pattern = generateStaircasePattern(numNewCouples);

          const newCouples = pattern.map((lane, index) => ({
            id: Date.now() + index,
            yPosition: -20 * index, // 약간의 간격을 두고 등장
            lane: lane,
          }));

          return [...prev, ...newCouples];
        }
        return prev;
      });
    };

    const spawnInterval = setInterval(spawnCouple, currentStage.spawnInterval);
    return () => clearInterval(spawnInterval);
  }, [gameStatus, currentStage, showIntro, showStageMessage]);

  // 키보드 이벤트 핸들러 최적화
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (gameStatus !== "playing") return;

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
    },
    [gameStatus, couples, checkCollisionWithCouple]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  // 모바일 컨트롤 핸들러 최적화
  const handleTouchControl = useCallback(
    (direction: "left" | "right") => {
      setPlayerLane((prev) => {
        const newLane =
          direction === "left" ? Math.max(0, prev - 1) : Math.min(2, prev + 1);
        couples.forEach((couple) => {
          checkCollisionWithCouple(newLane, couple.yPosition);
        });
        return newLane;
      });
    },
    [couples, checkCollisionWithCouple]
  );

  // 게임 상태 체크
  useEffect(() => {
    if (angerLevel >= 100) {
      setGameStatus("over");
    }
  }, [angerLevel]);

  // 스테이지 메시지 표시
  useEffect(() => {
    if (gameStatus === "playing") {
      setShowStageMessage(true);
      setCharacterMessage(currentStage.message);
      const timer = setTimeout(() => {
        setShowStageMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentStage, gameStatus]);

  return (
    <div
      className='fixed inset-0 overflow-hidden transition-colors duration-1000'
      style={{ backgroundColor: currentStage.background }}
    >
      {showStageMessage && (
        <div className='fixed inset-0 flex items-center justify-center z-40'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className='mx-4 w-[90%] max-w-md bg-black/50 p-6 rounded-lg backdrop-blur-sm'
          >
            <div className='text-center text-white'>
              <h2 className='text-2xl font-bold mb-2'>{currentStage.title}</h2>
              <p className='text-lg'>{characterMessage}</p>
            </div>
          </motion.div>
        </div>
      )}

      {showIntro && (
        <div className='fixed inset-0 flex items-center justify-center z-50'>
          <div className='mx-4 w-[90%] max-w-md bg-black/80 p-6 rounded-lg'>
            <div className='text-center text-white'>
              <h1 className='text-3xl font-bold mb-6'>솔로의 귀가길</h1>
              <p className='mb-8 text-lg'>
                "퇴근길에 커플들이 가득한 강남역... 솔로인 나는 무사히 집에
                돌아갈 수 있을까...?"
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className='px-8 py-3 bg-blue-600 text-white rounded-lg font-bold w-full'
                onClick={() => setShowIntro(false)}
              >
                시작하기
              </motion.button>
            </div>
          </div>
        </div>
      )}

      {gameStatus === "clear" && (
        <div className='fixed inset-0 flex items-center justify-center z-50'>
          <div className='mx-4 w-[90%] max-w-md bg-black/80 p-6 rounded-lg'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className='text-center text-white'
            >
              <h2 className='text-3xl font-bold mb-4'>미션 성공!</h2>
              <div className='relative w-full h-48 mb-8 bg-gray-800 rounded-lg overflow-hidden'>
                <motion.div
                  initial={{ x: -50 }}
                  animate={{ x: 150 }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                  className='absolute bottom-4 w-12 h-12'
                >
                  <PixelCharacter x={50} y={50} isPlayer={true} />
                </motion.div>
                <div
                  className='absolute right-4 bottom-4 w-16 h-24 bg-gray-700'
                  style={{
                    clipPath: "polygon(0 15%, 100% 0, 100% 100%, 0 100%)",
                  }}
                />
              </div>
              <p className='mb-8 text-lg'>
                "드디어 집이다! 오늘도 무사히 귀가 성공이야. 내일은 다른 길로
                돌아가야겠다..."
              </p>
              <p className='mb-4'>최종 점수: {Math.floor(score / 20)}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className='px-8 py-3 bg-blue-600 text-white rounded-lg font-bold w-full'
                onClick={() => router.push("/")}
              >
                다시 시작하기
              </motion.button>
            </motion.div>
          </div>
        </div>
      )}

      {gameStatus === "over" && (
        <div className='fixed inset-0 flex items-center justify-center z-50'>
          <div className='mx-4 w-[90%] max-w-md bg-black/80 p-6 rounded-lg'>
            <div className='text-center text-white'>
              <h2 className='text-3xl font-bold mb-4 text-red-500'>
                게임 오버...
              </h2>
              <p className='mb-4'>분노를 이기지 못했습니다...</p>
              <p className='mb-8'>
                "역시 강남은 커플천국이야... 다음엔 택시를 타야겠다."
              </p>
              <p className='mb-4'>최종 점수: {Math.floor(score / 20)}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className='px-8 py-3 bg-blue-600 text-white rounded-lg font-bold w-full'
                onClick={() => router.push("/")}
              >
                다시 시작하기
              </motion.button>
            </div>
          </div>
        </div>
      )}

      {/* 기존 UI 컴포넌트들... */}
      <div className='fixed inset-0 bg-gray-900 overflow-hidden'>
        {/* 스테이지 정보 */}
        <div className='absolute top-4 left-0 right-0 flex flex-col items-center text-white z-20'>
          <div className='text-lg font-bold'>{currentStage.title}</div>
          <div className='text-sm mt-1'>
            피한 커플: {avoidedCouples} / {currentStage.targetCouples}
          </div>
        </div>

        {/* 분노 게이지 */}
        <div className='absolute top-20 left-4 right-4 h-4 bg-gray-700 rounded-full overflow-hidden z-20'>
          <motion.div
            className='h-full bg-red-600'
            style={{ width: `${angerLevel}%` }}
            animate={{ width: `${angerLevel}%` }}
          />
        </div>

        {/* 점수 */}
        <div className='absolute top-28 left-4 text-white z-20'>
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
        </div>
      </div>
    </div>
  );
}
