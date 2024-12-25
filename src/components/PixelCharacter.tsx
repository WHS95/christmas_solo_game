import { motion } from "framer-motion";

interface PixelCharacterProps {
  x: number;
  y: number;
  isPlayer?: boolean;
  isCouple?: boolean;
  coupleStyle?: number;
}

const PixelCharacter: React.FC<PixelCharacterProps> = ({
  x,
  y,
  isPlayer = false,
  isCouple = false,
  coupleStyle = 0,
}) => {
  const getCoupleStyle = (style: number) => {
    switch (style) {
      case 0: // 빨간 커플
        return {
          body: "bg-red-600",
          head: "bg-[#FFD1B0]",
          hair: "bg-[#2C1810]",
          clothes: "bg-red-500",
        };
      case 1: // 분홍 커플
        return {
          body: "bg-pink-500",
          head: "bg-[#FFE4C4]",
          hair: "bg-[#4A3728]",
          clothes: "bg-pink-400",
        };
      case 2: // 보라 커플
        return {
          body: "bg-purple-600",
          head: "bg-[#F5D5C5]",
          hair: "bg-[#1A1A1A]",
          clothes: "bg-purple-500",
        };
      case 3: // 하늘색 커플
        return {
          body: "bg-sky-600",
          head: "bg-[#FFE8D6]",
          hair: "bg-[#3B2F2F]",
          clothes: "bg-sky-500",
        };
      default:
        return {
          body: "bg-red-600",
          head: "bg-[#FFD1B0]",
          hair: "bg-[#2C1810]",
          clothes: "bg-red-500",
        };
    }
  };

  return (
    <motion.div
      className='absolute'
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
      }}
      animate={{ y: [0, -2, 0] }}
      transition={{
        repeat: Infinity,
        duration: 0.6,
        ease: "easeInOut",
      }}
    >
      {isPlayer ? (
        // 플레이어 캐릭터 (솔로)
        <div className='relative w-8 h-12'>
          {/* 머리 */}
          <div className='absolute w-6 h-6 bg-[#FFD1B0] rounded-full left-1 top-0'>
            {/* 헤어 스타일 */}
            <div className='absolute w-6 h-3 bg-[#2C1810] rounded-t-full top-0' />
            {/* 눈 */}
            <div className='absolute w-1 h-1 bg-black rounded-full left-1.5 top-3' />
            <div className='absolute w-1 h-1 bg-black rounded-full right-1.5 top-3' />
          </div>
          {/* 몸통 */}
          <div className='absolute w-8 h-6 bg-blue-600 bottom-0 rounded-lg'>
            {/* 목 */}
            <div className='absolute w-2 h-2 bg-[#FFD1B0] top-0 left-3' />
            {/* 팔 */}
            <div className='absolute w-2 h-4 bg-blue-600 -left-1 top-1 rounded' />
            <div className='absolute w-2 h-4 bg-blue-600 -right-1 top-1 rounded' />
          </div>
        </div>
      ) : (
        // 커플 캐릭터
        <div className='relative w-14 h-12'>
          {/* 왼쪽 캐릭터 */}
          <div className='absolute left-0 w-6 h-12'>
            {/* 머리 */}
            <div
              className={`absolute w-5 h-5 ${
                getCoupleStyle(coupleStyle).head
              } rounded-full top-0`}
            >
              {/* 헤어 스타일 */}
              <div
                className={`absolute w-5 h-2.5 ${
                  getCoupleStyle(coupleStyle).hair
                } rounded-t-full top-0`}
              />
              {/* 눈 */}
              <div className='absolute w-0.5 h-0.5 bg-black rounded-full left-1.5 top-2.5' />
              <div className='absolute w-0.5 h-0.5 bg-black rounded-full right-1.5 top-2.5' />
            </div>
            {/* 몸통 */}
            <div
              className={`absolute w-6 h-5 ${
                getCoupleStyle(coupleStyle).clothes
              } bottom-0 rounded-lg`}
            >
              {/* 목 */}
              <div
                className={`absolute w-2 h-2 ${
                  getCoupleStyle(coupleStyle).head
                } top-0 left-2`}
              />
              {/* 팔 */}
              <div
                className={`absolute w-2 h-4 ${
                  getCoupleStyle(coupleStyle).clothes
                } -left-1 top-1 rounded`}
              />
            </div>
          </div>

          {/* 오른쪽 캐릭터 */}
          <div className='absolute right-0 w-6 h-12'>
            {/* 머리 */}
            <div
              className={`absolute w-5 h-5 ${
                getCoupleStyle(coupleStyle).head
              } rounded-full top-0`}
            >
              {/* 헤어 스타일 */}
              <div
                className={`absolute w-5 h-2.5 ${
                  getCoupleStyle(coupleStyle).hair
                } rounded-t-full top-0`}
              />
              {/* 눈 */}
              <div className='absolute w-0.5 h-0.5 bg-black rounded-full left-1.5 top-2.5' />
              <div className='absolute w-0.5 h-0.5 bg-black rounded-full right-1.5 top-2.5' />
            </div>
            {/* 몸통 */}
            <div
              className={`absolute w-6 h-5 ${
                getCoupleStyle(coupleStyle).clothes
              } bottom-0 rounded-lg`}
            >
              {/* 목 */}
              <div
                className={`absolute w-2 h-2 ${
                  getCoupleStyle(coupleStyle).head
                } top-0 left-2`}
              />
              {/* 팔 */}
              <div
                className={`absolute w-2 h-4 ${
                  getCoupleStyle(coupleStyle).clothes
                } -right-1 top-1 rounded`}
              />
            </div>
          </div>

          {/* 손잡은 모습 */}
          <div
            className={`absolute w-4 h-1.5 ${
              getCoupleStyle(coupleStyle).clothes
            } left-5 bottom-3 rounded-full`}
          />
        </div>
      )}
    </motion.div>
  );
};

export default PixelCharacter;
