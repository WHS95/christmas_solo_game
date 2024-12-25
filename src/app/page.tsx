"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main className='min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='text-center'
      >
        <h1 className='text-4xl font-bold text-red-500 mb-4'>
          크리스마스 솔로 서바이벌
        </h1>
        <p className='text-white mb-8'>커플들을 피해 무사히 집에 돌아가세요!</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className='px-8 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors'
          onClick={() => router.push("/game")}
        >
          게임 시작
        </motion.button>
      </motion.div>
    </main>
  );
}
