"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import PixelCharacter from "../../components/PixelCharacter";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";

// GameContent 컴포넌트를 dynamic import로 감싸기
const GameComponent = dynamic(() => Promise.resolve(GameContent), {
  ssr: false, // SSR 비활성화
  loading: () => <div>Loading...</div>, // 로딩 상태 표시
});

interface Couple {
  id: number;
  yPosition: number;
  lane: number;
  style: number;
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
  gameSpeed: {
    ROAD_SPEED: number;
    BUILDING_SPEED: number;
    LIGHT_SPEED: number;
    COUPLE_SPEED: number;
  };
}

// 게임 속도 관련 상수
const GAME_SPEED = {
  SLOW: {
    ROAD_SPEED: 10,
    BUILDING_SPEED: 1,
    LIGHT_SPEED: 4,
    COUPLE_SPEED: 2.0,
  },
  NORMAL: {
    ROAD_SPEED: 8,
    BUILDING_SPEED: 1,
    LIGHT_SPEED: 3,
    COUPLE_SPEED: 2.0,
  },
  FAST: {
    ROAD_SPEED: 5,
    BUILDING_SPEED: 1,
    LIGHT_SPEED: 2.4,
    COUPLE_SPEED: 2.5,
  },
  VERY_FAST: {
    ROAD_SPEED: 3,
    BUILDING_SPEED: 1,
    LIGHT_SPEED: 2,
    COUPLE_SPEED: 3.0,
  },
};

// 게임 상수 추가
const GAME_CONSTANTS = {
  ROAD_START: 20, // 도로 시작 위치 (y position)
  PLAYER_POSITION: 80, // 플레이어 위치
  COLLISION_START: 70, // 충돌 감지 시작 위치
  COLLISION_END: 82, // 충돌 감지 종료 위치
};

const STAGES: StageInfo[] = [
  {
    id: 1,
    targetCouples: 20,
    title: "아침 8시",
    message: "아침부터 커플이 있네...<br /> 출근길부터 피해가자...",
    background: "linear-gradient(180deg, #FFB6C1 0%, #87CEEB 100%)",
    spawnInterval: 800,
    maxCouplesAtOnce: 3,
    moveSpeed: GAME_SPEED.SLOW.COUPLE_SPEED,
    gameSpeed: GAME_SPEED.SLOW,
  },
  {
    id: 2,
    targetCouples: 30,
    title: "점심 12시",
    message: "헉... 점심 데이트 타임이네? <br /> 밥 먹으러 가는데 방해되게...",
    background: "linear-gradient(180deg, #87CEEB 0%, #4682B4 100%)",
    spawnInterval: 700,
    maxCouplesAtOnce: 4,
    moveSpeed: GAME_SPEED.NORMAL.COUPLE_SPEED,
    gameSpeed: GAME_SPEED.NORMAL,
  },
  {
    id: 3,
    targetCouples: 40,
    title: "오후 2시",
    message: "회사 앞이 데이트 존이었어...? <br /> 회의 가는 길인데...",
    background: "linear-gradient(180deg, #4682B4 0%, #2F4F4F 100%)",
    spawnInterval: 600,
    maxCouplesAtOnce: 5,
    moveSpeed: GAME_SPEED.FAST.COUPLE_SPEED,
    gameSpeed: GAME_SPEED.FAST,
  },
  {
    id: 4,
    targetCouples: 50,
    title: "퇴근 5시",
    message:
      "드디어 퇴근! <br /> 근데 이 시간에 커플이 <br /> 왜이렇게 많아...",
    background: "linear-gradient(180deg, #2F4F4F 0%, #191970 100%)",
    spawnInterval: 500,
    maxCouplesAtOnce: 6,
    moveSpeed: GAME_SPEED.FAST.COUPLE_SPEED,
    gameSpeed: GAME_SPEED.FAST,
  },
  {
    id: 5,
    targetCouples: 70,
    title: "저녁 6시",
    message: "이제 진짜 데이트 타임이구나... <br /> 빨리 집에 가자!",
    background: "linear-gradient(180deg, #191970 0%, #000033 100%)",
    spawnInterval: 400,
    maxCouplesAtOnce: 8,
    moveSpeed: GAME_SPEED.VERY_FAST.COUPLE_SPEED,
    gameSpeed: GAME_SPEED.VERY_FAST,
  },
];

function GameContent() {
  const router = useRouter();

  // 게임 상태 통합
  const [gameState, setGameState] = useState({
    angerLevel: 0,
    score: 0,
    avoidedCouples: 0,
    showIntro: true,
    showStageMessage: false,
    showReward: false,
    gameStatus: "playing" as "playing" | "over" | "clear",
    characterMessage: "",
    lastFrameTime: 0,
  });

  const [playerLane, setPlayerLane] = useState(1);
  const [couples, setCouples] = useState<Couple[]>([]);
  const [currentStage, setCurrentStage] = useState<StageInfo>(STAGES[0]);
  const [lastLanes, setLastLanes] = useState<number[]>([]);

  // Refs
  const gameLoopRef = useRef<number | null>(null);
  const couplesRef = useRef<Couple[]>([]);
  const playerLaneRef = useRef<number>(1);
  const touchStartRef = useRef<number>(0);
  const isMovingRef = useRef<boolean>(false);

  // 게임 상태 업데이트 함수
  const updateGameState = useCallback(
    (
      updates:
        | ((prev: typeof gameState) => typeof gameState)
        | Partial<typeof gameState>
    ) => {
      setGameState((prev) => {
        if (typeof updates === "function") {
          return updates(prev);
        }
        return { ...prev, ...updates };
      });
    },
    []
  );

  // 최적화된 터치 컨트롤
  const handleTouchStart = useCallback(
    (direction: "left" | "right") => {
      if (isMovingRef.current || gameState.showIntro) return;
      isMovingRef.current = true;

      const newLane =
        direction === "left"
          ? Math.max(0, playerLane - 1)
          : Math.min(2, playerLane + 1);

      // 충돌 체크 최적화
      let hasCollision = false;
      couplesRef.current.some((couple) => {
        if (
          couple.lane === newLane &&
          couple.yPosition >= GAME_CONSTANTS.COLLISION_START &&
          couple.yPosition <= GAME_CONSTANTS.COLLISION_END
        ) {
          hasCollision = true;
          return true;
        }
        return false;
      });

      if (hasCollision) {
        updateGameState({
          angerLevel: Math.min(100, gameState.angerLevel + 60),
        });
      }

      playerLaneRef.current = newLane;
      setPlayerLane(newLane);

      // 터치 바운스
      requestAnimationFrame(() => {
        isMovingRef.current = false;
      });
    },
    [gameState.showIntro, gameState.angerLevel, updateGameState, playerLane]
  );

  // 터치 이벤트 핸들러 최적화
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (gameState.showIntro) return;

      const touch = e.touches[0];
      const diffX = touch.clientX - touchStartRef.current;

      if (Math.abs(diffX) > 30) {
        // 최소 스와이프 거리
        handleTouchStart(diffX < 0 ? "left" : "right");
        touchStartRef.current = touch.clientX;
      }
    },
    [gameState.showIntro, handleTouchStart]
  );

  // 스테이지 변경 감지 및 메시지 설정
  useEffect(() => {
    updateGameState({ characterMessage: currentStage.message });
  }, [currentStage]);

  // 충돌 감지 함수 최적화
  const checkCollisionWithCouple = useCallback(
    (coupleLane: number, coupleYPosition: number) => {
      if (gameState.gameStatus !== "playing") return false;

      const isColliding =
        coupleLane === playerLane &&
        coupleYPosition >= GAME_CONSTANTS.COLLISION_START &&
        coupleYPosition <= GAME_CONSTANTS.COLLISION_END;

      if (isColliding) {
        updateGameState({
          angerLevel: Math.min(100, gameState.angerLevel + 50),
        });
      }
      return isColliding;
    },
    [gameState.gameStatus, playerLane, updateGameState]
  );

  // 게임 루프 최적화
  const gameLoop = useCallback(() => {
    if (gameState.gameStatus !== "playing") return;

    const timestamp = performance.now();
    const frameInterval = 1000 / 60; // 60 FPS

    if (timestamp - gameState.lastFrameTime >= frameInterval) {
      // 커플 위치 업데이트 및 충돌 체크
      setCouples((prevCouples) => {
        const updatedCouples = prevCouples
          .map((couple) => {
            const newY = couple.yPosition + currentStage.moveSpeed;
            // 현재 위치에서 충돌 체크
            if (
              couple.lane === playerLane &&
              newY >= GAME_CONSTANTS.COLLISION_START &&
              newY <= GAME_CONSTANTS.COLLISION_END
            ) {
              updateGameState((prev) => ({
                ...prev,
                angerLevel: Math.min(100, prev.angerLevel + 1),
              }));
            }
            return {
              ...couple,
              yPosition: newY,
            };
          })
          .filter((couple) => couple.yPosition <= 100);

        // 커플이 화면을 벗어났을 때 카운트 증가
        if (prevCouples.length > updatedCouples.length) {
          updateGameState((prev) => ({
            ...prev,
            avoidedCouples:
              prev.avoidedCouples +
              (prevCouples.length - updatedCouples.length),
          }));

          // 스테이지 클리어 체크
          if (
            gameState.avoidedCouples +
              (prevCouples.length - updatedCouples.length) >=
            currentStage.targetCouples
          ) {
            const nextStageIndex =
              STAGES.findIndex((s) => s.id === currentStage.id) + 1;
            if (nextStageIndex < STAGES.length) {
              setCouples([]);
              updateGameState({
                showStageMessage: true,
                avoidedCouples: 0,
              });
              setCurrentStage(STAGES[nextStageIndex]);
              setTimeout(() => {
                updateGameState({ showStageMessage: false });
              }, 1500);
            } else {
              updateGameState({ gameStatus: "clear" });
            }
          }
        }

        return updatedCouples;
      });

      // 점수 및 시간 업데이트
      updateGameState((prev) => ({
        ...prev,
        score: prev.score + 1,
        lastFrameTime: timestamp,
      }));
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [
    gameState.gameStatus,
    gameState.lastFrameTime,
    gameState.avoidedCouples,
    currentStage,
    playerLane,
    updateGameState,
  ]);

  // 게임 루프 시작/정지
  useEffect(() => {
    if (
      gameState.gameStatus === "playing" &&
      !gameState.showIntro &&
      !gameState.showStageMessage
    ) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [
    gameLoop,
    gameState.gameStatus,
    gameState.showIntro,
    gameState.showStageMessage,
  ]);

  // 컴포넌트 마운트/언마운트 최적화
  useEffect(() => {
    const touchMoveHandler = (e: TouchEvent) => handleTouchMove(e);
    window.addEventListener("touchmove", touchMoveHandler, { passive: true });

    return () => {
      window.removeEventListener("touchmove", touchMoveHandler);
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [handleTouchMove]);

  // 모바일 컨트롤 렌더링 최적화
  const MobileControls = useMemo(
    () => (
      <div className='absolute bottom-0 inset-x-0 h-32 flex justify-between p-4 z-30'>
        <button
          className='w-1/3 h-full bg-white/10 rounded-lg active:bg-white/20 text-white text-4xl'
          onTouchStart={() => handleTouchStart("left")}
        >
          ←
        </button>
        <button
          className='w-1/3 h-full bg-white/10 rounded-lg active:bg-white/20 text-white text-4xl'
          onTouchStart={() => handleTouchStart("right")}
        >
          →
        </button>
      </div>
    ),
    [handleTouchStart]
  );

  // 가중치를 적용한 랜덤 인 선택 함수
  const getWeightedRandomLane = useCallback((prevLanes: number[]) => {
    const lastLane = prevLanes[prevLanes.length - 1];
    let weights = [0.3, 0.4, 0.3];

    if (lastLane !== undefined) {
      weights = weights.map((w, i) => {
        if (i === lastLane) return w * 0.3;
        if (Math.abs(i - lastLane) === 2) return w * 0.7;
        return w * 1.2;
      });
    }

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const normalizedWeights = weights.map((w) => w / totalWeight);
    const random = Math.random();
    let sum = 0;

    for (let i = 0; i < normalizedWeights.length; i++) {
      sum += normalizedWeights[i];
      if (random <= sum) return i;
    }

    return 1;
  }, []);

  // 계단식 패턴 생성 함수
  const generateStaircasePattern = useCallback(
    (numCouples: number): number[] => {
      if (numCouples === 1) {
        const newLane = getWeightedRandomLane(lastLanes);
        setLastLanes((prev) => [...prev.slice(-2), newLane]);
        return [newLane];
      }

      if (numCouples === 2) {
        const firstLane = getWeightedRandomLane(lastLanes);
        let secondLane;
        do {
          secondLane = getWeightedRandomLane([...lastLanes, firstLane]);
        } while (secondLane === firstLane);

        setLastLanes((prev) => [...prev.slice(-1), firstLane, secondLane]);
        return [firstLane, secondLane];
      }

      const patterns = [
        [0, 1, 2],
        [2, 1, 0],
        [1, 0, 2],
        [1, 2, 0],
      ];

      let selectedPattern;
      do {
        selectedPattern = patterns[Math.floor(Math.random() * patterns.length)];
      } while (
        lastLanes.length > 0 &&
        selectedPattern[0] === lastLanes[lastLanes.length - 1]
      );

      setLastLanes((prev) => [...prev.slice(-1), ...selectedPattern]);
      return selectedPattern;
    },
    [lastLanes, getWeightedRandomLane]
  );

  // 커플 생성 로직
  useEffect(() => {
    if (
      gameState.gameStatus !== "playing" ||
      gameState.showIntro ||
      gameState.showStageMessage
    )
      return;

    const spawnCouple = () => {
      setCouples((prev) => {
        if (prev.length < currentStage.maxCouplesAtOnce) {
          const numNewCouples = currentStage.maxCouplesAtOnce - prev.length;
          const pattern = generateStaircasePattern(numNewCouples);

          const newCouples = pattern.map((lane, index) => ({
            id: Date.now() + index,
            yPosition: 0 - 25 * index, // 도로 시작 위치에서 시작하고 간격 유지
            lane: lane,
            style: Math.floor(Math.random() * 4),
          }));

          return [...prev, ...newCouples];
        }
        return prev;
      });
    };

    const spawnInterval = setInterval(spawnCouple, currentStage.spawnInterval);
    return () => clearInterval(spawnInterval);
  }, [
    gameState.gameStatus,
    currentStage,
    gameState.showIntro,
    gameState.showStageMessage,
    generateStaircasePattern,
  ]);

  // 레인 위치 계산 메이제션
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

  // 키보드 이벤트 핸들러 최적화
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (gameState.gameStatus !== "playing" || gameState.showIntro) return;

      switch (e.key) {
        case "ArrowLeft": {
          const newLane = Math.max(0, playerLane - 1);
          let hasCollision = false;
          couples.forEach((couple) => {
            if (
              couple.lane === newLane &&
              couple.yPosition >= GAME_CONSTANTS.COLLISION_START &&
              couple.yPosition <= GAME_CONSTANTS.COLLISION_END
            ) {
              hasCollision = true;
            }
          });

          if (hasCollision) {
            updateGameState({
              angerLevel: Math.min(100, gameState.angerLevel + 50),
            });
          }
          playerLaneRef.current = newLane;
          setPlayerLane(newLane);
          break;
        }
        case "ArrowRight": {
          const newLane = Math.min(2, playerLane + 1);
          let hasCollision = false;
          couples.forEach((couple) => {
            if (
              couple.lane === newLane &&
              couple.yPosition >= GAME_CONSTANTS.COLLISION_START &&
              couple.yPosition <= GAME_CONSTANTS.COLLISION_END
            ) {
              hasCollision = true;
            }
          });

          if (hasCollision) {
            updateGameState({
              angerLevel: Math.min(100, gameState.angerLevel + 50),
            });
          }
          playerLaneRef.current = newLane;
          setPlayerLane(newLane);
          break;
        }
      }
    },
    [
      gameState.gameStatus,
      gameState.showIntro,
      couples,
      playerLane,
      updateGameState,
    ]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  // 게임 상태 체크
  useEffect(() => {
    if (gameState.angerLevel >= 100) {
      updateGameState({ gameStatus: "over" });
    }
  }, [gameState.angerLevel, updateGameState]);

  return (
    <div className='relative w-full h-screen overflow-hidden game-container'>
      <div
        className='absolute inset-0 game-background'
        style={
          {
            backgroundColor: "transparent",
            backgroundImage: currentStage.background,
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            "--road-speed": `${currentStage.gameSpeed.ROAD_SPEED}s`,
            "--building-speed": `${currentStage.gameSpeed.BUILDING_SPEED}s`,
            "--light-speed": `${currentStage.gameSpeed.LIGHT_SPEED}s`,
          } as React.CSSProperties
        }
      >
        {/* 도시 배경 요소들 */}
        <div className='absolute inset-0'>
          {/* 왼쪽 건물 */}
          <div className='buildings-left'>
            <div className='building-windows' />
          </div>

          {/* 오른쪽 건물 */}
          <div className='buildings-right'>
            <div className='building-windows' />
          </div>

          {/* 도로 컨테이너 */}
          <div className='road-container'>
            {/* 도로 바닥 */}
            <div className='absolute inset-0 bg-gray-800'>
              {/* 도로 차선 */}
              <div
                className='road-lines'
                style={{
                  animationDuration: `var(--road-speed)`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {gameState.showStageMessage && (
        <div className='fixed inset-0 flex items-center justify-center z-40'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className='mx-4 w-[90%] max-w-md bg-black/50 p-6 rounded-lg backdrop-blur-sm'
          >
            <div className='text-center text-white'>
              <h2 className='text-2xl font-bold mb-2'>{currentStage.title}</h2>
              <p
                className='text-lg'
                dangerouslySetInnerHTML={{ __html: gameState.characterMessage }}
              />
            </div>
          </motion.div>
        </div>
      )}

      {gameState.showIntro && (
        <div className='fixed inset-0 flex items-center justify-center z-50'>
          <div className='mx-4 w-[90%] max-w-md bg-black/80 p-6 rounded-lg'>
            <div className='text-center text-white'>
              <h1 className='text-3xl font-bold mb-6'>솔로의 출 퇴근길</h1>
              <p className='mb-8 text-sm'>
                "출근길... 오늘따라 커플들이 더 많은 강남역. 이런 날 혼자라는게
                들통나면 안 되는데... 무사히 출 퇴근 할 수 있을까?"
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className='px-8 py-3 bg-blue-600 text-white rounded-lg font-bold w-full'
                onClick={() => updateGameState({ showIntro: false })}
              >
                시작하기
              </motion.button>
            </div>
          </div>
        </div>
      )}

      {gameState.gameStatus === "clear" && (
        <div className='fixed inset-0 flex items-center justify-center z-50'>
          <div className='mx-4 w-[90%] max-w-md bg-black/80 p-6 rounded-lg'>
            {!gameState.showReward ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className='text-center text-white'
              >
                <h2 className='text-3xl font-bold mb-4'>미션 성공!</h2>
                <p className='mb-8 text-lg'>
                  "드디어... 무사히 집까지 왔다..."
                </p>
                {/* <p className='mb-4'>
                  최종 점수: {Math.floor(gameState.score / 20)}
                </p> */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className='px-8 py-3 bg-blue-600 text-white rounded-lg font-bold w-full'
                  onClick={() => updateGameState({ showReward: true })}
                >
                  성공 보상 받기
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className='text-center text-white'
              >
                <h2 className='text-3xl font-bold mb-4'>현실로 왔다...</h2>
                <div className='relative w-full aspect-video mb-8 rounded-lg overflow-hidden'>
                  <Image
                    src='/solo.jpg'
                    alt='솔로의 승리'
                    fill
                    className='object-cover'
                    priority
                  />
                </div>
                <p className='mb-8 text-lg'>
                  "이렇게 또 하루를 버텼네...
                  <br />
                  내년에는 나도 누군가와 함께...
                  <br />
                  아니야, 혼자여도 충분해! ...
                </p>
                <div className='space-y-2'>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className='px-8 py-3 bg-blue-600 text-white rounded-lg font-bold w-full'
                    onClick={() => router.push("/")}
                  >
                    재 도 전
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className='px-8 py-3 bg-pink-600 text-white rounded-lg font-bold w-full'
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.origin);
                      alert(
                        "링크가 복사되었습니다! 솔로 친구에게 공유해보세요 😊"
                      );
                    }}
                  >
                    솔로 친구에게 공유하기
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {gameState.gameStatus === "over" && (
        <div className='fixed inset-0 flex items-center justify-center z-50'>
          <div className='mx-4 w-[90%] max-w-md bg-black/80 p-6 rounded-lg'>
            <div className='text-center text-white'>
              <h2 className='text-3xl font-bold mb-4 text-red-500'>
                게임 오버
              </h2>
              <div className='relative w-full aspect-video mb-8 rounded-lg overflow-hidden'>
                <Image
                  src='/fail.jpeg'
                  alt='솔로의 실패'
                  fill
                  className='object-cover'
                  priority
                />
              </div>
              <p className='mb-4'>
                최종 점수: {Math.floor(gameState.score / 20)}
              </p>
              <div className='space-y-2'>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className='px-8 py-3 bg-blue-600 text-white rounded-lg font-bold w-full'
                  onClick={() => router.push("/")}
                >
                  재도전
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className='px-8 py-3 bg-pink-600 text-white rounded-lg font-bold w-full'
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin);
                    alert(
                      "링크가 복사되었습니다! 솔로 친구에게 공유해보세요 😊"
                    );
                  }}
                >
                  솔로 친구에게 공유하기
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 스테이지 정보 */}
      <div className='absolute top-4 left-0 right-0 flex flex-col items-center text-white z-30 bg-black/50 p-4 rounded-lg'>
        <div className='text-lg font-bold'>{currentStage.title}</div>
        <div className='text-sm mt-1'>
          피한 커플: {gameState.avoidedCouples} / {currentStage.targetCouples}
        </div>
      </div>

      {/* 분노 게이지 */}
      <div className='absolute top-20 left-4 right-4 flex items-center gap-2 z-30 bg-black/50 p-2 rounded-lg'>
        <div className='flex-1 h-4 bg-gray-700 rounded-full overflow-hidden'>
          <motion.div
            className='h-full bg-red-600'
            style={{ width: `${gameState.angerLevel}%` }}
            animate={{ width: `${gameState.angerLevel}%` }}
          />
        </div>
        <div className='text-white font-bold min-w-[3rem] text-right'>
          {Math.floor(gameState.angerLevel)}%
        </div>
      </div>

      {/* 점수 */}
      {/* <div className='absolute top-36 left-4 text-white z-30'>
        점수: {Math.floor(gameState.scoregameState.score / 20)}
      </div> */}

      {/* 게임 캐릭터들 */}
      <div className='absolute inset-0 z-20'>
        {/* 플레이어 캐릭터 */}
        <PixelCharacter
          x={getLanePosition(playerLane)}
          y={GAME_CONSTANTS.PLAYER_POSITION}
          isPlayer={true}
        />

        {/* 커플 NPC들 */}
        {couples.map((couple) => (
          <PixelCharacter
            key={couple.id}
            x={getLanePosition(couple.lane)}
            y={couple.yPosition}
            isCouple={true}
            coupleStyle={couple.style}
          />
        ))}
      </div>

      {MobileControls}
    </div>
  );
}

// 메인 포넌트
export default function GamePage() {
  return <GameComponent />;
}
