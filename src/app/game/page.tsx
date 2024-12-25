"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useCallback, useMemo } from "react";
import PixelCharacter from "../../components/PixelCharacter";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";

// 컴포넌트를 클라이언트 사이드에서만 렌더링하도록 수정
const GameComponent = dynamic(() => Promise.resolve(GameContent), {
  ssr: false,
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
    ROAD_SPEED: 3,
    BUILDING_SPEED: 1,
    LIGHT_SPEED: 4,
    COUPLE_SPEED: 1.5,
  },
  NORMAL: {
    ROAD_SPEED: 2.5,
    BUILDING_SPEED: 1,
    LIGHT_SPEED: 3,
    COUPLE_SPEED: 2.0,
  },
  FAST: {
    ROAD_SPEED: 2,
    BUILDING_SPEED: 1,
    LIGHT_SPEED: 2.4,
    COUPLE_SPEED: 2.5,
  },
  VERY_FAST: {
    ROAD_SPEED: 1.5,
    BUILDING_SPEED: 1,
    LIGHT_SPEED: 2,
    COUPLE_SPEED: 3.0,
  },
};

// 게임 상수 추가
const GAME_CONSTANTS = {
  ROAD_START: 20, // 도로 시작 위치 (y position)
  PLAYER_POSITION: 80, // 플레이어 위치
  COLLISION_START: 75, // 충돌 감지 시작 위치
  COLLISION_END: 85, // 충돌 감지 종료 위치
};

const STAGES: StageInfo[] = [
  {
    id: 1,
    targetCouples: 10,
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
    targetCouples: 20,
    title: "점심 12시",
    message: "헉... 점심 데이트 타임이네? <br /> 밥 먹으러 가는데 방해되게...",
    background: "linear-gradient(180deg, #87CEEB 0%, #4682B4 100%)",
    spawnInterval: 700,
    maxCouplesAtOnce: 3,
    moveSpeed: GAME_SPEED.NORMAL.COUPLE_SPEED,
    gameSpeed: GAME_SPEED.NORMAL,
  },
  {
    id: 3,
    targetCouples: 30,
    title: "오후 2시",
    message: "회사 앞이 데이트 존이었어...? <br /> 회의 가는 길인데...",
    background: "linear-gradient(180deg, #4682B4 0%, #2F4F4F 100%)",
    spawnInterval: 600,
    maxCouplesAtOnce: 4,
    moveSpeed: GAME_SPEED.FAST.COUPLE_SPEED,
    gameSpeed: GAME_SPEED.FAST,
  },
  {
    id: 4,
    targetCouples: 40,
    title: "퇴근 4시",
    message: "디어 퇴근! <br /> 근데 이 시간에 커플이 왜이렇게 많아...",
    background: "linear-gradient(180deg, #2F4F4F 0%, #191970 100%)",
    spawnInterval: 500,
    maxCouplesAtOnce: 4,
    moveSpeed: GAME_SPEED.FAST.COUPLE_SPEED,
    gameSpeed: GAME_SPEED.FAST,
  },
  {
    id: 5,
    targetCouples: 50,
    title: "저녁 6시",
    message: "이제 진짜 데이트 타임이구나... <br /> 빨리 집에 가자!",
    background: "linear-gradient(180deg, #191970 0%, #000033 100%)",
    spawnInterval: 400,
    maxCouplesAtOnce: 5,
    moveSpeed: GAME_SPEED.VERY_FAST.COUPLE_SPEED,
    gameSpeed: GAME_SPEED.VERY_FAST,
  },
];

function GameContent() {
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
  const [showReward, setShowReward] = useState(false);
  const [lastLanes, setLastLanes] = useState<number[]>([]);

  // 가중치를 적용한 랜덤 레인 선택 함수
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
    if (gameStatus !== "playing" || showIntro || showStageMessage) return;

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
    gameStatus,
    currentStage,
    showIntro,
    showStageMessage,
    generateStaircasePattern,
  ]);

  // 충돌 감지 함수 최적화
  const checkCollisionWithCouple = useCallback(
    (coupleLane: number, coupleYPosition: number) => {
      if (gameStatus !== "playing") return false;

      const isColliding =
        coupleLane === playerLane &&
        coupleYPosition >= GAME_CONSTANTS.COLLISION_START &&
        coupleYPosition <= GAME_CONSTANTS.COLLISION_END;

      if (isColliding) {
        setAngerLevel((prev) => Math.min(100, prev + 5));
      }
      return isColliding;
    },
    [gameStatus, playerLane]
  );

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

  // 스테이지 변경 감지 및 메시지 설정
  useEffect(() => {
    setCharacterMessage(currentStage.message);
  }, [currentStage]);

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
              if (newCount >= currentStage.targetCouples) {
                const nextStageIndex =
                  STAGES.findIndex((s) => s.id === currentStage.id) + 1;
                if (nextStageIndex < STAGES.length) {
                  setCouples([]);
                  setShowStageMessage(true);
                  setCurrentStage(STAGES[nextStageIndex]);
                  setAvoidedCouples(0);
                  setTimeout(() => {
                    setShowStageMessage(false);
                  }, 1500);
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

  // 키보드 이벤트 핸들러 최적화
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (gameStatus !== "playing" || showIntro) return;

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
    [gameStatus, couples, checkCollisionWithCouple, showIntro]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  // 모바일 컨트롤 핸들러 최적화
  const handleTouchControl = useCallback(
    (direction: "left" | "right") => {
      if (showIntro) return;

      setPlayerLane((prev) => {
        const newLane =
          direction === "left" ? Math.max(0, prev - 1) : Math.min(2, prev + 1);
        couples.forEach((couple) => {
          checkCollisionWithCouple(newLane, couple.yPosition);
        });
        return newLane;
      });
    },
    [couples, checkCollisionWithCouple, showIntro]
  );

  // 게임 상태 체크
  useEffect(() => {
    if (angerLevel >= 100) {
      setGameStatus("over");
    }
  }, [angerLevel]);

  return (
    <div className='relative w-full h-screen overflow-hidden game-container'>
      <div
        className='absolute inset-0 game-background'
        style={
          {
            background: currentStage.background,
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
              <p
                className='text-lg'
                dangerouslySetInnerHTML={{ __html: characterMessage }}
              />
            </div>
          </motion.div>
        </div>
      )}

      {showIntro && (
        <div className='fixed inset-0 flex items-center justify-center z-50'>
          <div className='mx-4 w-[90%] max-w-md bg-black/80 p-6 rounded-lg'>
            <div className='text-center text-white'>
              <h1 className='text-3xl font-bold mb-6'>솔로의 귀가길</h1>
              <p className='mb-8 text-sm'>
                "집으로가는길... 오늘따라 커플들이 더 많은 강남역. 이런 날
                혼자라는게 들통나면 안 되는데... 무사히 집까지 도망칠 수
                있을까...?"
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
            {!showReward ? (
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
                <p className='mb-4'>최종 점수: {Math.floor(score / 20)}</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className='px-8 py-3 bg-blue-600 text-white rounded-lg font-bold w-full'
                  onClick={() => setShowReward(true)}
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
                <h2 className='text-3xl font-bold mb-4'>현실로 아왔다...</h2>
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

      {gameStatus === "over" && (
        <div className='fixed inset-0 flex items-center justify-center z-50'>
          <div className='mx-4 w-[90%] max-w-md bg-black/80 p-6 rounded-lg'>
            <div className='text-center text-white'>
              <h2 className='text-3xl font-bold mb-4 text-red-500'>
                게임 오버
              </h2>
              <p className='mb-4'>커플 지옥에 빠졌다...</p>
              <p className='mb-8'>"왜 나만 혼자인거야 !!!!!!"</p>
              <p className='mb-4'>최종 점수: {Math.floor(score / 20)}</p>
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
      <div className='absolute top-4 left-0 right-0 flex flex-col items-center text-white z-30'>
        <div className='text-lg font-bold'>{currentStage.title}</div>
        <div className='text-sm mt-1'>
          피한 커플: {avoidedCouples} / {currentStage.targetCouples}
        </div>
      </div>

      {/* 분노 게이지 */}
      <div className='absolute top-20 left-4 right-4 flex items-center gap-2 z-30 bg-black/50 p-2 rounded-lg'>
        <div className='flex-1 h-4 bg-gray-700 rounded-full overflow-hidden'>
          <motion.div
            className='h-full bg-red-600'
            style={{ width: `${angerLevel}%` }}
            animate={{ width: `${angerLevel}%` }}
          />
        </div>
        <div className='text-white font-bold min-w-[3rem] text-right'>
          {Math.floor(angerLevel)}%
        </div>
      </div>

      {/* 점수 */}
      <div className='absolute top-36 left-4 text-white z-30'>
        점수: {Math.floor(score / 20)}
      </div>

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

      {/* 모바일 컨트롤 */}
      <div className='absolute bottom-0 inset-x-0 h-32 flex justify-between p-4 z-30'>
        <button
          className='w-1/3 h-full bg-white/10 rounded-lg active:bg-white/20 text-white text-4xl'
          onClick={() => handleTouchControl("left")}
        >
          ←
        </button>
        <button
          className='w-1/3 h-full bg-white/10 rounded-lg active:bg-white/20 text-white text-4xl'
          onClick={() => handleTouchControl("right")}
        >
          →
        </button>
      </div>
    </div>
  );
}

// 메인 컴포넌트
export default function GamePage() {
  return <GameComponent />;
}
