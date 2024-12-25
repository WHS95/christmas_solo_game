import { motion } from "framer-motion";

interface PixelCharacterProps {
  x: number;
  y: number;
  isPlayer?: boolean;
  isCouple?: boolean;
}

export default function PixelCharacter({
  x,
  y,
  isPlayer = false,
  isCouple = false,
}: PixelCharacterProps) {
  return (
    <motion.div
      className='absolute'
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
        width: "40px",
        height: "60px",
      }}
      initial={false}
    >
      <div
        className={`w-full h-full ${isPlayer ? "player" : "couple"}`}
        style={{ position: "relative" }}
      >
        <style jsx>{`
          .player {
            position: relative;
            width: 100%;
            height: 100%;
            animation: run 0.6s infinite;
          }

          .player::before {
            content: "";
            position: absolute;
            width: 100%;
            height: 60%;
            background: #3498db;
            bottom: 0;
            border-radius: 8px;
          }

          .player::after {
            content: "";
            position: absolute;
            width: 40%;
            height: 30%;
            background: #ffd700;
            top: 15%;
            left: 30%;
            border-radius: 50%;
            box-shadow: 0 -5px 0 5px #3498db;
          }

          .couple {
            position: relative;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: space-between;
            padding: 2px;
            animation: run 0.6s infinite;
          }

          .couple::before,
          .couple::after {
            content: "";
            position: absolute;
            width: 45%;
            height: 100%;
            background: #e74c3c;
            border-radius: 8px;
          }

          .couple::before {
            left: 0;
          }

          .couple::after {
            right: 0;
          }

          /* 커플 캐릭터 머리 */
          .couple > div {
            content: "";
            position: absolute;
            width: 40%;
            height: 30%;
            background: #ffd700;
            top: 15%;
            border-radius: 50%;
            box-shadow: 0 -5px 0 5px #e74c3c;
          }

          .couple > div:first-child {
            left: 2%;
          }

          .couple > div:last-child {
            right: 2%;
          }

          @keyframes run {
            0%,
            100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-2px);
            }
          }
        `}</style>
        {isCouple && (
          <>
            <div />
            <div />
          </>
        )}
      </div>
    </motion.div>
  );
}
